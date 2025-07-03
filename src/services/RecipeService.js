import AsyncStorage from "@react-native-async-storage/async-storage";
import { sampleRecipes } from "../data/sampleRecipes";

const RECIPES_STORAGE_KEY = "app_recipes";

class RecipeService {
  static async initializeRecipes() {
    try {
      const storedRecipes = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (storedRecipes === null) {
        // No recipes found, initialize with sample data
        await AsyncStorage.setItem(
          RECIPES_STORAGE_KEY,
          JSON.stringify(sampleRecipes)
        );
        console.log("Recipes initialized with sample data.");
        return sampleRecipes;
      }
      console.log("Recipes already initialized.");
      const parsedRecipes = JSON.parse(storedRecipes);
      return this.rehydrateRecipeImages(parsedRecipes);
    } catch (error) {
      console.error("Error initializing recipes:", error);
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
      console.error("Error getting recipes:", error);
      return []; // Return empty array on error
    }
  }

  static rehydrateRecipeImages(recipes) {
    const rehydrated = recipes.map((recipeFromStorage) => {
      const originalSampleRecipe = sampleRecipes.find(
        (sample) => sample.id === recipeFromStorage.id
      );

      if (originalSampleRecipe) {
        // This recipe was originally a sample recipe.
        // Restore its imageUri from the canonical sampleRecipes list
        // to ensure require() paths for local assets are correctly rehydrated.
        console.log(
          `[RecipeService] Rehydrating image for sample recipe: ${recipeFromStorage.title} (ID: ${recipeFromStorage.id}) using image from original sample.`
        );
        return {
          ...recipeFromStorage,
          imageUri: originalSampleRecipe.imageUri,
        };
      } else {
        // This is a user-created recipe or its ID doesn't match any sample.
        // Assume its imageUri in storage is already a valid string URI (from ImagePicker or a placeholder string).
        console.log(
          `[RecipeService] User-created or non-sample recipe: ${recipeFromStorage.title} (ID: ${recipeFromStorage.id}). Using stored imageUri:`,
          recipeFromStorage.imageUri
        );
        return recipeFromStorage; // Use the imageUri as it was stored
      }
    });
    console.log("[RecipeService] Rehydration complete. Result:", rehydrated);
    return rehydrated;
  }

  static async saveRecipes(recipes) {
    try {
      console.log("[RecipeService] Saving recipes:", recipes.length);
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
      console.log("[RecipeService] Recipes saved successfully");
      return this.rehydrateRecipeImages(recipes); // Return the rehydrated recipes
    } catch (error) {
      console.error("[RecipeService] Error saving recipes:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  static async getRecipeById(id) {
    try {
      console.log("Getting recipe by ID:", id);
      const recipes = await this.getRecipes();
      const recipe = recipes.find((recipe) => recipe.id === id);

      if (!recipe) {
        console.log("Recipe not found:", id);
        return null;
      }

      // If it's a sample recipe, use the original image
      const originalSampleRecipe = sampleRecipes.find(
        (sample) => sample.id === recipe.id
      );
      if (originalSampleRecipe) {
        console.log("Found original sample recipe, using its image");
        return {
          ...recipe,
          imageUri: originalSampleRecipe.imageUri,
        };
      }

      // For user-created recipes, use the stored imageUri
      console.log("Using stored recipe data for user-created recipe");
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
      console.log("Recipes database reloaded with sample data.");
      return newRecipes;
    } catch (error) {
      console.error("Error reloading recipes with sample data:", error);
      throw error;
    }
  }
}

export default RecipeService;
