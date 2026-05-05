import AsyncStorage from '@react-native-async-storage/async-storage';
import RecipeService from '../RecipeService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock sampleRecipes
jest.mock('../../data/sampleRecipes', () => ({
  sampleRecipes: [
    {
      id: '1',
      title: 'Test Recipe',
      imageUri: 'mock-recipe-1.jpg',
      ingredients: [
        { id: '1001', name: 'Butter', imageUri: 'mock-butter.jpg' },
        { id: '1002', name: 'Sugar' }
      ]
    }
  ]
}));

// Mock ingredientDatabase
jest.mock('../../data/ingredientDatabase', () => ({
  Butter: { name: 'Butter', imageUri: 'db-butter.jpg' },
  Sugar: { name: 'Sugar', imageUri: 'db-sugar.jpg' },
  Flour: { name: 'Flour', imageUri: 'db-flour.jpg' }
}));

describe('RecipeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    // Suppress console.error for tests that intentionally trigger errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('initializeRecipes', () => {
    it('should initialize with sample recipes when no stored recipes exist', async () => {
      const result = await RecipeService.initializeRecipes();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_recipes');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_recipes',
        JSON.stringify([
          {
            id: '1',
            title: 'Test Recipe',
            imageUri: 'mock-recipe-1.jpg',
            ingredients: [
              { id: '1001', name: 'Butter', imageUri: 'mock-butter.jpg' },
              { id: '1002', name: 'Sugar' }
            ]
          }
        ])
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Recipe');
    });

    it('should return rehydrated recipes when stored recipes exist', async () => {
      const storedRecipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          imageUri: 'stored-uri',
          ingredients: [
            { id: '1001', name: 'Butter', imageUri: 'stored-butter-uri' }
          ]
        }
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedRecipes));

      const result = await RecipeService.initializeRecipes();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_recipes');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].imageUri).toBe('stored-uri');
    });

    it('should fallback to sample recipes on error', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await RecipeService.initializeRecipes();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Recipe');
    });
  });

  describe('getRecipes', () => {
    it('should return stored and rehydrated recipes', async () => {
      const storedRecipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          ingredients: [
            { id: '1001', name: 'Butter' }
          ]
        }
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedRecipes));

      const result = await RecipeService.getRecipes();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_recipes');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Recipe 1');
    });

    it('should initialize recipes if none are stored', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await RecipeService.getRecipes();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Recipe');
    });

    it('should return empty array on error', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await RecipeService.getRecipes();

      expect(result).toEqual([]);
    });
  });

  describe('rehydrateRecipeImages', () => {
    it('should prioritize stored imageUri for recipes', () => {
      const recipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          imageUri: 'stored-uri',
          ingredients: []
        }
      ];

      const result = RecipeService.rehydrateRecipeImages(recipes);

      expect(result[0].imageUri).toBe('stored-uri');
    });

    it('should extract uri from object imageUri', () => {
      const recipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          imageUri: { uri: 'object-uri' },
          ingredients: []
        }
      ];

      const result = RecipeService.rehydrateRecipeImages(recipes);

      expect(result[0].imageUri).toBe('object-uri');
    });

    it('should fallback to sample recipe imageUri when none stored', () => {
      const recipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          ingredients: []
        }
      ];

      const result = RecipeService.rehydrateRecipeImages(recipes);

      expect(result[0].imageUri).toBe('mock-recipe-1.jpg');
    });

    it('should handle ingredient image rehydration', () => {
      const recipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          ingredients: [
            { id: '1001', name: 'Butter', imageUri: 'stored-ing-uri' },
            { id: '1002', name: 'Sugar' } // No stored image
          ]
        }
      ];

      const result = RecipeService.rehydrateRecipeImages(recipes);

      expect(result[0].ingredients[0].imageUri).toBe('stored-ing-uri');
      expect(result[0].ingredients[1].imageUri).toBe('db-sugar.jpg'); // From database
    });

    it('should extract uri from object ingredient imageUri', () => {
      const recipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          ingredients: [
            { id: '1001', name: 'Butter', imageUri: { uri: 'object-ing-uri' } }
          ]
        }
      ];

      const result = RecipeService.rehydrateRecipeImages(recipes);

      expect(result[0].ingredients[0].imageUri).toBe('object-ing-uri');
    });

    it('should fallback to sample ingredient image when none stored', () => {
      const recipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          ingredients: [
            { id: '1001', name: 'Butter' } // No stored image
          ]
        }
      ];

      const result = RecipeService.rehydrateRecipeImages(recipes);

      expect(result[0].ingredients[0].imageUri).toBe('mock-butter.jpg');
    });
  });

  describe('saveRecipes', () => {
    it('should process and save recipes with imageUri normalization', async () => {
      const recipes = [
        {
          id: '1',
          title: 'Test Recipe 1',
          imageUri: { uri: 'object-uri' },
          ingredients: [
            { id: '1001', name: 'Butter', imageUri: { uri: 'object-ing-uri' } }
          ]
        }
      ];

      const result = await RecipeService.saveRecipes(recipes);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_recipes',
        JSON.stringify([
          {
            id: '1',
            title: 'Test Recipe 1',
            imageUri: 'object-uri',
            ingredients: [
              { id: '1001', name: 'Butter', imageUri: 'object-ing-uri' }
            ]
          }
        ])
      );
      expect(result[0].imageUri).toBe('object-uri');
      expect(result[0].ingredients[0].imageUri).toBe('object-ing-uri');
    });

    it('should throw error on save failure', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Save failed'));

      await expect(RecipeService.saveRecipes([])).rejects.toThrow('Save failed');
    });
  });

  describe('saveRecipe', () => {
    it('should update existing recipe', async () => {
      const existingRecipes = [
        { id: '1', title: 'Old Title', ingredients: [] }
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingRecipes));

      const newRecipe = {
        id: '1',
        title: 'Updated Title',
        imageUri: 'new-uri',
        ingredients: [
          { id: '1001', name: 'Butter', imageUri: 'new-ing-uri' }
        ]
      };

      const result = await RecipeService.saveRecipe(newRecipe);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_recipes',
        JSON.stringify([
          {
            id: '1',
            title: 'Updated Title',
            imageUri: 'new-uri',
            ingredients: [
              { id: '1001', name: 'Butter', imageUri: 'new-ing-uri' }
            ]
          }
        ])
      );
      expect(result.imageUri).toBe('new-uri');
    });

    it('should add new recipe when it does not exist', async () => {
      const existingRecipes = [
        { id: '1', title: 'Existing', ingredients: [] }
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingRecipes));

      const newRecipe = {
        id: '2',
        title: 'New Recipe',
        ingredients: []
      };

      await RecipeService.saveRecipe(newRecipe);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_recipes',
        JSON.stringify([
          { id: '1', title: 'Existing', ingredients: [] },
          { id: '2', title: 'New Recipe', ingredients: [] }
        ])
      );
    });

    it('should handle empty recipes storage', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const newRecipe = {
        id: '1',
        title: 'New Recipe',
        ingredients: []
      };

      await RecipeService.saveRecipe(newRecipe);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_recipes',
        JSON.stringify([
          { id: '1', title: 'New Recipe', ingredients: [] }
        ])
      );
    });

    it('should throw error on save failure', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Get failed'));

      await expect(RecipeService.saveRecipe({ id: '1', title: 'Test', ingredients: [] })).rejects.toThrow('Get failed');
    });
  });

  describe('getRecipeById', () => {
    it('should return recipe when found', async () => {
      const storedRecipes = [
        { id: '1', title: 'Test Recipe', ingredients: [] }
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedRecipes));

      const result = await RecipeService.getRecipeById('1');

      expect(result).not.toBeNull();
      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Recipe');
    });

    it('should return null when recipe not found', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      const result = await RecipeService.getRecipeById('999');

      expect(result).toBeNull();
    });

    it('should handle stored imageUri over sample fallback', async () => {
      const storedRecipes = [
        {
          id: '1',
          title: 'Test Recipe',
          imageUri: 'stored-uri',
          ingredients: []
        }
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedRecipes));

      const result = await RecipeService.getRecipeById('1');

      expect(result.imageUri).toBe('stored-uri');
    });

    it('should fallback to sample imageUri when none stored and is sample recipe', async () => {
      const storedRecipes = [
        {
          id: '1',
          title: 'Test Recipe',
          ingredients: []
        }
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedRecipes));

      const result = await RecipeService.getRecipeById('1');

      expect(result.imageUri).toBe('mock-recipe-1.jpg');
    });

    it('should return null on error', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Get failed'));

      const result = await RecipeService.getRecipeById('1');

      expect(result).toBeNull();
    });
  });

  describe('resetRecipesToSampleData', () => {
    it('should clear storage and reinitialize with sample data', async () => {
      const result = await RecipeService.resetRecipesToSampleData();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_recipes');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Recipe');
    });

    it('should throw error on failure', async () => {
      AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Remove failed'));

      await expect(RecipeService.resetRecipesToSampleData()).rejects.toThrow('Remove failed');
    });
  });
});