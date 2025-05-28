const sampleRecipes = [
  {
    id: '1',
    title: 'Chocolate Chip Brownies',
    ingredients: [
      { id: '1001', name: 'Flour', amount: 160, unit: 'g', requireTare: true },
      { id: '1002', name: 'Butter', amount: 180, unit: 'g', requireTare: true },
    ],
    imageUri: null,
    
  },
  {
    id: '2',
    title: 'Classic Pancakes',
    ingredients: [
      { id: '2001', name: 'Flour', amount: 150, unit: 'g' },
      { id: '2002', name: 'Sugar', amount: 100, unit: 'g' },
      { id: '2003', name: 'Butter', amount: 120, unit: 'g' }
    ],
    imageUri: null,
  },
  {
    id: '3',
    title: 'Beef Stir Fry',
    ingredients: [
      { id: '3001', name: 'Flour', amount: 150, unit: 'g' },
      { id: '3002', name: 'Sugar', amount: 100, unit: 'g' },
      { id: '3003', name: 'Butter', amount: 120, unit: 'g' }
    ],
    imageUri: null,
  }
];

export default sampleRecipes;
