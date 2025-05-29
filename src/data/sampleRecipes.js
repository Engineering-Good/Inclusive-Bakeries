import { Platform } from 'react-native';

const recipeImages = {
  chocolatechipcookie: Platform.OS === 'web' 
    ? require('../assets/chocolatechipcookie.png')
    : require('../assets/chocolatechipcookie.png'),
  bananacake: Platform.OS === 'web'
    ? require('../assets/bananacake.png')
    : require('../assets/bananacake.png'),
  brownies: Platform.OS === 'web'
    ? require('../assets/brownies.png')
    : require('../assets/brownies.png'),
};

export const sampleRecipes = [
  {
    id: '1',
    title: 'Chocolate Chip Cookies',
    ingredients: [
      { id: '1001', name: 'Flour', amount: 160, unit: 'g', requireTare: true },
      { id: '1002', name: 'Butter', amount: 180, unit: 'g', requireTare: true },
    ],
    imageUri: recipeImages.chocolatechipcookie,
  },
  {
    id: '2',
    title: 'Banana Cake',
    ingredients: [
      { id: '2001', name: 'Flour', amount: 150, unit: 'g' },
      { id: '2002', name: 'Sugar', amount: 100, unit: 'g' },
      { id: '2003', name: 'Butter', amount: 120, unit: 'g' }
    ],
    imageUri: recipeImages.bananacake,
  },
  {
    id: '3',
    title: 'Brownies',
    ingredients: [
      { id: '3001', name: 'Flour', amount: 150, unit: 'g' },
      { id: '3002', name: 'Sugar', amount: 100, unit: 'g' },
      { id: '3003', name: 'Butter', amount: 120, unit: 'g' }
    ],
    imageUri: recipeImages.brownies,
  }
];
