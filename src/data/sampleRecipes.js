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
      { id: '1001', name: 'Flour', amount: 2700, unit: 'g', requireTare: true },
      { id: '1002', name: 'Almonds', amount: 600, unit: 'g', requireTare: true },
      { id: '1003', name: 'Oats', amount: 2400, unit: 'g', requireTare: true },
      { id: '1004', name: 'ChocolateChips', amount: 2000, unit: 'g', requireTare: true },
      { id: '1005', name: 'Sugar (Brown)', amount: 1000, unit: 'g', requireTare: true },
      { id: '1006', name: 'Sugar (Castor)', amount: 700, unit: 'g', requireTare: true },
      { id: '1007', name: 'Sugar (Fine)', amount: 1000, unit: 'g', requireTare: true },
      { id: '1008', name: 'Butter', amount: 2250, unit: 'g', requireTare: true },
    ],
    imageUri: recipeImages.chocolatechipcookie,
  },
  {
    id: '2',
    title: 'Cranberry',
    ingredients: [
      { id: '2001', name: 'Flour', amount: 2560, unit: 'g', requireTare: true },
      { id: '2002', name: 'Oats', amount: 1980, unit: 'g', requireTare: true },
      { id: '2003', name: 'ChocolateChips', amount: 3000, unit: 'g', requireTare: true },
      { id: '2004', name: 'Sugar (Brown)', amount: 1740, unit: 'g', requireTare: true },
      { id: '2005', name: 'Sugar (Fine)', amount: 660, unit: 'g', requireTare: true },
      { id: '2006', name: 'Butter', amount: 2160, unit: 'g', requireTare: true }
    ],
    imageUri: recipeImages.cranberry,
  },
  {
    id: '3',
    title: 'Portuguese Egg Tarts',
    ingredients: [
      { id: '3001', name: 'Butter', amount: 125, unit: 'g', requireTare: true },
      { id: '3002', name: 'Sugar', amount: 125, unit: 'g', requireTare: true },
      { id: '3004', name: 'Take a new bowl', amount: '', unit: '', requireTare: false },
      { id: '3005', name: 'Flour', amount: 200, unit: 'g', requireTare: true},
      { id: '3007', name: 'Baking Powder', amount: 5, unit: 'g', requireTare: true },
      { id: '3008', name: 'Cocoa Powder', amount: 10, unit: 'g', requireTare: true }
    ],
    imageUri: recipeImages.portugueseeggtarts,
  },
  {
    id: '4',
    title: 'Brownies',
    ingredients: [
      //{ id: '4001', name: 'Flour', amount: 180, unit: 'g', requireTare: false },
      //{ id: '4002', name: 'Sugar', amount: 100, unit: 'g', requireTare: true },
      { id: '4003', name: 'Eggs', amount: 2, unit: '', requireTare: false },
      { id: '4004', name: 'Butter', amount: 160, unit: 'g', requireTare: false },
      { id: '4005', name: 'Salt', amount: 0.5, unit: 'tsp', requireTare: false }
      
    ],
    imageUri: recipeImages.brownies,
  }
];
