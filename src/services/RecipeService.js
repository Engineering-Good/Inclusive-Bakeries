import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleRecipes } from '../data/sampleRecipes';
import ingredientDatabase from '../data/ingredientDatabase';

const RECIPES_STORAGE_KEY = 'app_recipes';

class RecipeService {
  static async initializeRecipes() {
    try {
      const storedRecipes = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (storedRecipes === null) {
        // No recipes found, initialize with sample data
        await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(sampleRecipes));
        return sampleRecipes;
      }
      const parsedRecipes = JSON.parse(storedRecipes);
      return this.rehydrateRecipeImages(parsedRecipes);
    } catch (error) {
      console.error('Error initializing recipes:', error);
      return sampleRecipes; // Fallback to sample data on error
    }
  }

  static async getRecipes() {
    try {
      const storedRecipes = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (storedRecipes !== null) {
        const parsedRecipes = JSON.parse(storedRecipes);
        return this.rehydrateRecipeImages(parsedRecipes);
      }
      // If no recipes are stored, initialize and return sample recipes
      return await this.initializeRecipes();
    } catch (error) {
      console.error('Error getting recipes:', error);
      return []; // Return empty array on error
    }
  }

  static rehydrateRecipeImages(recipes) {
    const rehydrated = recipes.map(recipeFromStorage => {
      const originalSampleRecipe = sampleRecipes.find(sample => sample.id === recipeFromStorage.id);

      // Process recipe image
      // Prioritize the stored imageUri. If it's an object, extract the uri.
      // Only fall back to the originalSampleRecipe.imageUri if recipeFromStorage.imageUri is not set (or invalid)
      // AND it's a recipe that originated from samples.
      let finalImageUri = recipeFromStorage.imageUri;
      if (recipeFromStorage.imageUri) { // If an imageUri is stored for the recipe
        if (typeof recipeFromStorage.imageUri === 'object' && recipeFromStorage.imageUri.uri) {
          finalImageUri = recipeFromStorage.imageUri.uri;
        }
        // If it's already a string (path, URL, or base64), use it directly.
       } else if (originalSampleRecipe) { // No imageUri stored for recipe, but it was a sample
         finalImageUri = originalSampleRecipe.imageUri;
      }
      // If no stored imageUri and not a sample (or sample has no imageUri), finalImageUri will be undefined.
      // The UI should handle undefined with a placeholder.

      // Process ingredient images
      const rehydratedIngredients = recipeFromStorage.ingredients.map(ingredient => {
        let ingredientImageUri = ingredient.imageUri; // Start with the stored imageUri for this ingredient

        // If an imageUri is stored for the ingredient, prioritize it.
        // This handles strings (URLs, base64, local asset paths) and extracts 'uri' from objects.
        if (ingredient.imageUri) {
          if (typeof ingredient.imageUri === 'object' && ingredient.imageUri.uri) {
            ingredientImageUri = ingredient.imageUri.uri;
          }
          // If it's a valid string (local path, URL, or base64), use it directly.
          // No need to check ingredientDatabase here, as the user's saved choice should be respected.
        } else {
          // No imageUri stored for this specific ingredient.
          // Check if it's a recipe that originated from samples and try to use the sample's ingredient image.
          if (originalSampleRecipe) {
            const originalIngredient = originalSampleRecipe.ingredients.find(i => i.id === ingredient.id);
             if (originalIngredient && originalIngredient.imageUri) {
               ingredientImageUri = originalIngredient.imageUri;
            }
          }

          // If still no imageUri, and the ingredient name exists in the database, use the database image.
          // This provides a default if none was ever set or saved.
           if (!ingredientImageUri && ingredient.name && ingredientDatabase[ingredient.name] && ingredientDatabase[ingredient.name].imageUri) {
             ingredientImageUri = ingredientDatabase[ingredient.name].imageUri;
          }
        }
        
        // If, after all checks, ingredientImageUri is still not set (e.g., no saved image, not from sample, not in DB),
        // it will be undefined. The UI should handle this with a placeholder.

        return {
          ...ingredient,
          imageUri: ingredientImageUri // This will be a string (uri/path/base64) or undefined.
        };
      });

      return {
        ...recipeFromStorage,
        imageUri: finalImageUri, // This will be a string (uri/path/base64) or undefined.
        ingredients: rehydratedIngredients
      };
    });
    return rehydrated;
  }

  static async saveRecipes(recipes) {
    try {
      // Process recipes before saving
      const processedRecipes = recipes.map(recipe => ({
        ...recipe,
        imageUri: typeof recipe.imageUri === 'object' && recipe.imageUri.uri ? recipe.imageUri.uri : recipe.imageUri,
        ingredients: recipe.ingredients.map(ing => ({
          ...ing,
          imageUri: typeof ing.imageUri === 'object' && ing.imageUri.uri ? ing.imageUri.uri : ing.imageUri
        }))
      }));
      
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(processedRecipes));
      return this.rehydrateRecipeImages(processedRecipes);
    } catch (error) {
      console.error('[RecipeService] Error saving recipes:', error);
      throw error;
    }
  }

  static async saveRecipe(recipe) {
    try {
      // Get current recipes
      const storedRecipesStr = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      let recipes = storedRecipesStr ? JSON.parse(storedRecipesStr) : [];
      
      // Process the recipe before saving
      const processedRecipe = {
        ...recipe,
        imageUri: recipe.imageUri && typeof recipe.imageUri === 'object' && recipe.imageUri.uri 
          ? recipe.imageUri.uri 
          : recipe.imageUri,
        ingredients: recipe.ingredients.map(ing => ({
          ...ing,
          imageUri: ing.imageUri && typeof ing.imageUri === 'object' && ing.imageUri.uri 
            ? ing.imageUri.uri 
            : ing.imageUri
        }))
      };
      
      // Update or add the recipe
      const existingIndex = recipes.findIndex(r => r.id === recipe.id);
      if (existingIndex !== -1) {
        recipes[existingIndex] = processedRecipe;
      } else {
        recipes.push(processedRecipe);
      }
      
      // Save all recipes
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));

      // Return the processed recipe
      return processedRecipe;
    } catch (error) {
      console.error('[RecipeService] Error saving recipe:', error);
      throw error;
    }
  }

  static async getRecipeById(id) {
    try {
      const recipes = await this.getRecipes(); // This call already rehydrates images
      const recipe = recipes.find(r => r.id === id);
      
      if (!recipe) {
        return null;
      }

      // Check if the recipe (already rehydrated) has a valid imageUri.
      // The `getRecipes` call via `rehydrateRecipeImages` should have already
      // prioritized any saved imageUri.
      // We only need to override if the rehydrated recipe's imageUri is somehow not set
      // AND it's a known sample recipe.
      if (recipe.imageUri) {
        return recipe;
      }

      // If recipe.imageUri is not set (e.g., undefined or empty string) after rehydration,
      // and it's a sample recipe, try to use the original sample's image.
      const originalSampleRecipe = sampleRecipes.find(sample => sample.id === recipe.id);
      if (originalSampleRecipe && originalSampleRecipe.imageUri) {
        return {
          ...recipe,
          imageUri: originalSampleRecipe.imageUri
        };
      }

      return recipe; // Return as is, imageUri will be undefined if not set.
    } catch (error) {
      console.error(`Error getting recipe with ID ${id}:`, error);
      return null;
    }
  }

  static async resetRecipesToSampleData() {
    try {
      await AsyncStorage.removeItem(RECIPES_STORAGE_KEY); // Clear existing recipes
      const newRecipes = await this.initializeRecipes(); // Re-initialize with sample data
      return newRecipes;
    } catch (error) {
      console.error('Error reloading recipes with sample data:', error);
      throw error;
    }
  }
}

export default RecipeService;
