import { useState, useEffect } from 'react';
import useWeighingLogic from './useWeighingLogic';

/**
 * Custom hook to manage the state of a single ingredient step in a recipe.
 * It determines if the required weight has been reached and provides feedback on the current weight.
 * @param {object} ingredient - The ingredient for the current step.
 * @param {number} currentWeight - The current weight measured by the scale.
 * @param {boolean} isStable - A boolean indicating if the scale reading is stable.
 * @returns {object} An object containing `weightReached` and `getBackgroundColor`.
 */
const useIngredientStep = (ingredient, currentWeight, isStable) => {
  const [weightReached, setWeightReached] = useState(false);

  const { isWithinTolerance, isOverTolerance, progress } = useWeighingLogic(
    ingredient,
    currentWeight
  );

  useEffect(() => {
    const isWeighable = ingredient.stepType === 'weighable';
    const isInstruction = ingredient.stepType === 'instruction';

    if (isInstruction) {
      setWeightReached(true);
      return;
    }

    if (isWeighable) {
      // For weighable items, any significant weight indicates presence
      if (currentWeight > 1) {
        setWeightReached(true);
      }
      return;
    }

    // For weight-based items, it depends on being within tolerance and stable
    if (isWithinTolerance && isStable) {
      setWeightReached(true);
    } else {
      // Also consider it "reached" if it's over tolerance, to allow user to proceed
      // The UI color will indicate it's over, but the next button should be enabled
      setWeightReached(isOverTolerance);
    }

  }, [ingredient, currentWeight, isStable, isWithinTolerance, isOverTolerance]);

  const getBackgroundColor = () => {
    const requireScale = ingredient.unit === "g";
    if (!requireScale) return '#4CAF50'; // Green for non-weight items

    if (isOverTolerance) return '#0900FF'; // Blue for over
    if (isWithinTolerance) return '#4CAF50'; // Green for perfect
    // Use progress to determine if the scale is empty or has some weight
    if (progress > 0.01) return '#F44336'; // Red for under
    return '#F44336'; // Red for empty scale
  };

  return { weightReached, getBackgroundColor };
};

export default useIngredientStep;
