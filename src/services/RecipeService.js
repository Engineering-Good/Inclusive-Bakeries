import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleRecipes } from '../data/sampleRecipes';

const RECIPES_STORAGE_KEY = 'app_recipes';

class RecipeService {
  static async initializeRecipes() {
    try {
      const storedRecipes = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (storedRecipes === null) {
        // No recipes found, initialize with sample data
        await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(sampleRecipes));
        console.log('Recipes initialized with sample data.');
        return sampleRecipes;
      }
      console.log('Recipes already initialized.');
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
    console.log('[RecipeService] Rehydrating images for recipes:', recipes);
    const rehydrated = recipes.map(recipeFromStorage => {
      const originalSampleRecipe = sampleRecipes.find(sample => sample.id === recipeFromStorage.id);

      // Process recipe image
      let finalImageUri = recipeFromStorage.imageUri;
      if (originalSampleRecipe) {
        // This recipe was originally a sample recipe.
        // Restore its imageUri from the canonical sampleRecipes list
        console.log(`[RecipeService] Rehydrating image for sample recipe: ${recipeFromStorage.title} (ID: ${recipeFromStorage.id}) using image from original sample.`);
        finalImageUri = originalSampleRecipe.imageUri;
      } else if (typeof finalImageUri === 'object') {
        // Handle case where imageUri is an object with uri property
        finalImageUri = finalImageUri.uri;
      }

      // Process ingredient images
      const rehydratedIngredients = recipeFromStorage.ingredients.map(ingredient => {
        let ingredientImageUri = ingredient.imageUri;
        if (originalSampleRecipe) {
          // Try to find matching ingredient in sample recipe
          const originalIngredient = originalSampleRecipe.ingredients.find(i => i.id === ingredient.id);
          if (originalIngredient) {
            ingredientImageUri = originalIngredient.imageUri;
          }
        } else if (typeof ingredientImageUri === 'object') {
          // Handle case where imageUri is an object with uri property
          ingredientImageUri = ingredientImageUri.uri;
        }

        return {
          ...ingredient,
          imageUri: ingredientImageUri
        };
      });

      return {
        ...recipeFromStorage,
        imageUri: finalImageUri,
        ingredients: rehydratedIngredients
      };
    });
    console.log('[RecipeService] Rehydration complete. Result:', rehydrated);
    return rehydrated;
  }

  static async saveRecipes(recipes) {
    try {
      console.log('[RecipeService] Saving recipes:', recipes.length);
      
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
      console.log('[RecipeService] Recipes saved successfully');
      return this.rehydrateRecipeImages(processedRecipes);
    } catch (error) {
      console.error('[RecipeService] Error saving recipes:', error);
      throw error;
    }
  }

  static async saveRecipe(recipe) {
    try {
      console.log('[RecipeService] Saving recipe:', recipe.title);
      
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
      console.log('[RecipeService] Recipe saved successfully');
      
      // Return the processed recipe
      return processedRecipe;
    } catch (error) {
      console.error('[RecipeService] Error saving recipe:', error);
      throw error;
    }
  }

  static async getRecipeById(id) {
    try {
      console.log('Getting recipe by ID:', id);
      const recipes = await this.getRecipes();
      const recipe = recipes.find(recipe => recipe.id === id);
      
      if (!recipe) {
        console.log('Recipe not found:', id);
        return null;
      }

      // If it's a sample recipe, use the original image
      const originalSampleRecipe = sampleRecipes.find(sample => sample.id === recipe.id);
      if (originalSampleRecipe) {
        console.log('Found original sample recipe, using its image');
        return {
          ...recipe,
          imageUri: originalSampleRecipe.imageUri
        };
      }

      // For user-created recipes, use the stored imageUri
      console.log('Using stored recipe data for user-created recipe');
      return recipe;
    } catch (error) {
      console.error(`Error getting recipe with ID ${id}:`, error);
      return null;
    }
  }

  static async resetRecipesToSampleData() {
    try {
      await AsyncStorage.removeItem(RECIPES_STORAGE_KEY); // Clear existing recipes
      const newRecipes = await this.initializeRecipes(); // Re-initialize with sample data
      console.log('Recipes database reloaded with sample data.');
      return newRecipes;
    } catch (error) {
      console.error('Error reloading recipes with sample data:', error);
      throw error;
    }
  }
}

export default RecipeService;
