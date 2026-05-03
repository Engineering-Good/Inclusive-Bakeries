import { Platform } from 'react-native';

const recipeImages = {
  chocolatechipcookie: require('../assets/recipes/chocolatechipcookie.jpeg'),
  bananacake: require('../assets/recipes/bananacake.jpeg'),
  cranberry: require('../assets/recipes/cranberry.jpg'),
  brownies: require('../assets/recipes/brownies.webp'),
  portugueseeggtarts: require('../assets/recipes/portugueseeggtarts.png'),
  butter: require('../assets/ingredients/butter.png'),
  chocolatecake: require('../assets/recipes/placeholder.png'),
};

export const sampleRecipes = [
  {
    id: '1',
    title: 'Dark Chocolate',
    ingredients: [
      { 
        id: '1001', 
        name: 'Butter', 
        amount: 125, 
        unit: 'g', 
        requireTare: true, 
        imageUri: recipeImages.butter,
        stepType: 'weight',
        tolerance: 2
      },
      { 
        id: '1002', 
        name: 'Sugar', 
        amount: 125, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 2
      },

      { 
        id: '1004', 
        name: 'Eggs', 
        amount: 2, 
        unit: 'eggs', 
        requireTare: false,
        stepType: 'weighable',
        instructionText: 'Add eggs one at a time, mixing well after each addition.'
      },
      { 
        id: '1005', 
        name: 'Flour', 
        amount: 200, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 2
      },
    ],
    imageUri: recipeImages.chocolatechipcookie,
  },
  {
    id: '2',
    title: 'Cranberry',
    ingredients: [
      { 
        id: '2001', 
        name: 'Flour', 
        amount: 150, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 2
      },

      { 
        id: '2003', 
        name: 'Sugar', 
        amount: 100, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 2
      },
      { 
        id: '2004', 
        name: 'Butter', 
        amount: 120, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 2
      }
    ],
    imageUri: recipeImages.cranberry,
  },
  {
    id: '3',
    title: 'Portuguese Egg Tarts',
    ingredients: [
      { 
        id: '3001', 
        name: 'Butter', 
        amount: 125, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 10
      },
      { 
        id: '3002', 
        name: 'Sugar', 
        amount: 125, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 10
      },

      { 
        id: '3004', 
        name: 'Eggs', 
        amount: 3, 
        unit: 'eggs', 
        requireTare: false,
        stepType: 'weighable',
        instructionText: 'Add eggs one at a time, ensuring each egg is fully incorporated before adding the next one.'
      },
      { 
        id: '3005', 
        name: 'Flour', 
        amount: 200, 
        unit: 'g', 
        requireTare: true,
        stepType: 'weight',
        tolerance: 10
      }
    ],
    imageUri: recipeImages.portugueseeggtarts,
  },
  {
    id: '4',
    title: 'Brownies',
    ingredients: [

      { 
        id: '4002', 
        name: 'Eggs', 
        amount: 2, 
        unit: 'eggs', 
        requireTare: false,
        stepType: 'weighable',
        instructionText: 'Add eggs and mix until well combined'
      },
      { 
        id: '4003', 
        name: 'Butter', 
        amount: 160, 
        unit: 'g', 
        requireTare: false,
        stepType: 'weight',
        tolerance: 2
      },

    ],
    imageUri: recipeImages.brownies,
  },
  {
    id: '5',
    title: 'Comprehensive Chocolate Cake',
    ingredients: [
      {
        id: '5001',
        name: 'Flour',
        amount: 200,
        unit: 'g',
        requireTare: true,
        stepType: 'weight',
        tolerance: 5,
        instructionText: 'Measure flour precisely for best results.',
        ingredientGathering: true,
        gatheringStepType: 'weighable',
        gatheringUnit: 'packs',
        gatheringQuantity: '1'
      },
      {
        id: '5002',
        name: 'Butter',
        amount: 150,
        unit: 'g',
        requireTare: true,
        stepType: 'weight',
        tolerance: 2,
        instructionText: 'Use softened butter at room temperature.',
        ingredientGathering: false,
        gatheringStepType: 'weight',
        gatheringUnit: 'g',
        gatheringQuantity: ''
      },
      {
        id: '5003',
        name: 'Sugar',
        amount: 200,
        unit: 'g',
        requireTare: true,
        stepType: 'weight',
        tolerance: 3,
        instructionText: 'Granulated sugar works best for this recipe.',
        ingredientGathering: true,
        gatheringStepType: 'weighable',
        gatheringUnit: 'packs',
        gatheringQuantity: '1'
      },
      {
        id: '5004',
        name: 'Eggs',
        amount: 3,
        unit: 'eggs',
        requireTare: false,
        stepType: 'weighable',
        instructionText: 'Crack eggs gently and add one at a time.',
        ingredientGathering: false,
        gatheringStepType: 'weight',
        gatheringUnit: 'g',
        gatheringQuantity: ''
      },
      {
        id: '5005',
        name: 'Cocoa Powder',
        amount: 30,
        unit: 'g',
        requireTare: true,
        stepType: 'weight',
        tolerance: 1,
        instructionText: 'Use unsweetened cocoa powder.',
        ingredientGathering: true,
        gatheringStepType: 'weighable',
        gatheringUnit: 'bottles',
        gatheringQuantity: '1'
      },
      {
        id: '5006',
        name: 'Milk',
        amount: 100,
        unit: 'g',
        requireTare: false,
        stepType: 'weight',
        tolerance: 5,
        instructionText: 'Room temperature milk is preferred.',
        ingredientGathering: false,
        gatheringStepType: 'weight',
        gatheringUnit: 'g',
        gatheringQuantity: ''
      },
      {
        id: '5007',
        name: 'Baking Powder',
        amount: 5,
        unit: 'tsp',
        requireTare: false,
        stepType: 'weighable',
        instructionText: 'Level teaspoons for accurate measurement.',
        ingredientGathering: true,
        gatheringStepType: 'weighable',
        gatheringUnit: 'packs',
        gatheringQuantity: '1'
      },
      {
        id: '5008',
        name: 'Vanilla Extract',
        amount: 2,
        unit: 'tsp',
        requireTare: false,
        stepType: 'weighable',
        instructionText: 'Pure vanilla extract for best flavor.',
        ingredientGathering: true,
        gatheringStepType: 'weighable',
        gatheringUnit: 'bottles',
        gatheringQuantity: '1'
      }
    ],
    imageUri: recipeImages.chocolatecake,
  }
];
