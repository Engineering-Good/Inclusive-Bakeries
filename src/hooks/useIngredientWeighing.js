import { useCallback, useEffect } from 'react';
import useWeightCalculations from './useWeightCalculations';
import useScaleConnection from './useScaleConnection';
import useIngredientSpeech from './useIngredientSpeech';
import { INGREDIENT_MESSAGES } from '../constants/speechText';

/**
 * Custom hook that orchestrates the complete weighing workflow for an ingredient.
 * Composes focused hooks for scale, calculations, and speech.
 * 
 * @param {object} ingredient - The ingredient for the current step
 * @returns {object} Complete weighing workflow state and actions
 */
const useIngredientWeighing = (ingredient) => {
  const requireScale = ingredient?.stepType === 'weight' || ingredient?.stepType === 'weighable';

  const {
    currentWeight,
    isStable,
    isConnected,
    isMockScaleActive,
    connectionError,
    reset: resetScale,
  } = useScaleConnection(requireScale);

  const {
    weightReached,
    progress,
    targetWeight,
    tolerance,
    minWeight,
    maxWeight,
    isWithinTolerance,
    isOverTolerance,
    getBackgroundColor,
  } = useWeightCalculations(ingredient, currentWeight, isStable);

  const speechMessage = (() => {
    if (isOverTolerance) {
      return INGREDIENT_MESSAGES.TOO_MUCH;
    }
    if (isWithinTolerance && isStable) {
      return INGREDIENT_MESSAGES.WELL_DONE;
    }
    if (isWithinTolerance || progress >= 0.8) {
      return INGREDIENT_MESSAGES.ADD_SLOWLY;
    }
    if (progress > 0) {
      return INGREDIENT_MESSAGES.ADD_MORE;
    }
    return null;
  })();

  const {
    speak,
    replay,
    stopAll,
  } = useIngredientSpeech(speechMessage);

  // Reset state when ingredient changes
  useEffect(() => {
    resetScale();
    stopAll();
  }, [ingredient, resetScale, stopAll]);

  const reset = useCallback(() => {
    resetScale();
    stopAll();
  }, [resetScale, stopAll]);

  return {
    // State from useScaleConnection
    currentWeight,
    isStable,
    isConnected,
    isMockScaleActive,
    connectionError,
    // State from useWeightCalculations
    weightReached,
    progress,
    targetWeight,
    tolerance,
    minWeight,
    maxWeight,
    isWithinTolerance,
    isOverTolerance,
    // Actions from useIngredientSpeech
    speak,
    replay,
    reset,
    getBackgroundColor,
  };
};

export default useIngredientWeighing;