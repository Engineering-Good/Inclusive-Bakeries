import { useState, useCallback } from 'react';

/**
 * Custom hook to manage ingredient completion tracking and navigation.
 * Handles marking ingredients as completed and navigating to the next one.
 * 
 * @param {object} params - Hook parameters
 * @param {number} params.ingredientIndex - Current ingredient index
 * @param {object} params.recipe - The recipe object with ingredients array
 * @param {function} params.navigation - React Navigation navigation object
 * @param {object} params.route - React Navigation route object
 * @returns {object} Completion tracking state and navigation functions
 */
const useRecipeProgress = ({ ingredientIndex, recipe, navigation, route }) => {
  const initialCompleted = (route.params && route.params.completedIndices) || [];
  const [completedIndices, setCompletedIndices] = useState(initialCompleted);

  const ingredient = recipe.ingredients[ingredientIndex];

  // Determine if this is the final step
  const isFinalStep = (() => {
    const completedSet = new Set(completedIndices || []);
    completedSet.add(ingredientIndex);
    for (let i = 0; i < recipe.ingredients.length; i++) {
      if (!completedSet.has(i)) return false;
    }
    return true;
  })();

  // Navigate to next ingredient or celebration screen
  const proceedToNextStep = useCallback(() => {
    const prevCompleted = (route.params && route.params.completedIndices) || completedIndices || [];
    const completedSet = new Set(prevCompleted);
    completedSet.add(ingredientIndex);
    const newCompleted = Array.from(completedSet).sort((a, b) => a - b);
    setCompletedIndices(newCompleted);

    // Find the next uncompleted ingredient
    const total = recipe.ingredients.length;
    let nextIndex = -1;
    for (let i = 0; i < total; i++) {
      if (!completedSet.has(i)) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex === -1) {
      // All ingredients completed
      navigation.replace('Celebration');
    } else {
      navigation.replace('Ingredient', {
        ingredientIndex: nextIndex,
        recipe,
        completedIndices: newCompleted,
      });
    }
  }, [completedIndices, navigation, route.params, recipe]);

  return {
    completedIndices,
    setCompletedIndices,
    isFinalStep,
    ingredient,
    proceedToNextStep,
  };
};

export default useRecipeProgress;
