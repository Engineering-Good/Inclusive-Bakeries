const sampleRecipes = [
  {
    id: '1',
    title: 'Chocolate Chip Brownies',
    ingredients: [
      { id: '1001', name: 'Butter', amount: 125, unit: 'g', requireTare: true },
      { id: '1002', name: 'Sugar', amount: 125, unit: 'g', requireTare: true },
      { id: '1003', name: 'Flour', amount: 200, unit: 'g', requireTare: true },
      { id: '1004', name: 'BakingPowder', amount: 5, unit: 'g', requireTare: true },
      { id: '1005', name: 'CocoaPowder', amount: 10, unit: 'g', requireTare: true },
    ],
    imageUri: 'https://handletheheat.com/wp-content/uploads/2017/03/chewy-brownies-SQUARE-500x500.jpg',
  },
  {
    id: '2',
    title: 'Classic Pancakes',
    ingredients: [
      { id: '2001', name: 'Flour', amount: 150, unit: 'g', requireTare: true },
      { id: '2002', name: 'Sugar', amount: 100, unit: 'g', requireTare: true },
      { id: '2003', name: 'Butter', amount: 120, unit: 'g', requireTare: true }
    ],
    imageUri: 'https://www.inspiredtaste.net/wp-content/uploads/2016/07/Pancake-Recipe-1-1200.jpg',
  },
  {
    id: '3',
    title: 'Chocolate Muffins',
    ingredients: [
      { id: '3001', name: 'FullCreamMilk', amount: 225, unit: 'g', requireTare: true },
      { id: '3002', name: 'Eggs', amount: 2, unit: '', requireTare: true },
      { id: '3003', name: 'Oil', amount: 50, unit: 'g', requireTare: true },
      { id: '3004', name: 'Sugar', amount: 80, unit: 'g', requireTare: true },
      { id: '3005', name: 'Flour', amount: 130, unit: 'g', requireTare: true},
      { id: '3006', name: 'CocoaPowder', amount: 15, unit: 'g', requireTare: true },
      { id: '3007', name: 'BakingPowder', amount: 12, unit: 'g', requireTare: true },
      { id: '3008', name: 'Salt', amount: 0.5, unit: 'tsp', requireTare: true },
      { id: '3009', name: 'ChocolateChips', amount: 75, unit: 'g', requireTare: true }
    ],
    imageUri: 'https://www.spatuladesserts.com/wp-content/uploads/2024/09/Double-chocolate-muffins-04172-1.jpg',
  }
];

export default sampleRecipes;
