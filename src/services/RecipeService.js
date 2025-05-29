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
    // Map through recipes and rehydrate image URIs from sampleRecipes
    return recipes.map(recipe => {
      const sampleRecipe = sampleRecipes.find(sample => sample.id === recipe.id);
      if (sampleRecipe) {
        return {
          ...recipe,
          imageUri: sampleRecipe.imageUri
        };
      }
      return recipe;
    });
  }

  static async saveRecipes(recipes) {
    try {
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
      console.log('Recipes saved successfully.');
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  }

  static async getRecipeById(id) {
    try {
      const recipes = await this.getRecipes();
      return recipes.find(recipe => recipe.id === id);
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
