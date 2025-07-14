import { Platform } from 'react-native';

const recipeImages = {
  chocolatechipcookie: require('../assets/recipes/chocolatechipcookie.jpeg'),
  bananacake: require('../assets/recipes/bananacake.jpeg'),
  cranberry: require('../assets/recipes/cranberry.jpg'),
  brownies: require('../assets/recipes/brownies.webp'),
  portugueseeggtarts: require('../assets/recipes/portugueseeggtarts.png'),
  butter: require('../assets/ingredients/butter.png'),
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
        id: '1003',
        name: 'Mix butter and sugar',
        stepType: 'instruction',
        instructionText: 'Mix butter and sugar until light and fluffy. The mixture should be pale in color.',
        requiresCheck: true
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
        id: '2002',
        name: 'Preheat oven',
        stepType: 'instruction',
        instructionText: 'Preheat the oven to 180 degrees Celsius',
        requiresCheck: false
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
        id: '3003',
        name: 'Check mixture consistency',
        stepType: 'instruction',
        instructionText: 'Mix until the butter and sugar are well combined. The mixture should be smooth with no sugar granules visible.',
        requiresCheck: true
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
        id: '4001',
        name: 'Preheat oven',
        stepType: 'instruction',
        instructionText: 'Preheat the oven to 180 degrees Celsius and line a baking tin with parchment paper',
        requiresCheck: false
      },
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
      {
        id: '4004',
        name: 'Check mixture',
        stepType: 'instruction',
        instructionText: 'The mixture should be glossy and smooth. Check that all ingredients are well combined.',
        requiresCheck: true
      }
    ],
    imageUri: recipeImages.brownies,
  }
];
