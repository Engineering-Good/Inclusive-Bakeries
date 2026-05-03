import { useCallback, useEffect, useRef } from 'react';
import useWeightCalculations from './useWeightCalculations';
import useScaleConnection from './useScaleConnection';
import useIngredientSpeech from './useIngredientSpeech';
import SpeechService from '../services/SpeechService';
import { INGREDIENT_MESSAGES, RECIPE_MESSAGES, SCALE_MESSAGES } from '../constants/speechText';

/**
 * Custom hook that orchestrates the complete weighing workflow for an ingredient.
 * Composes focused hooks for scale, calculations, and speech.
 * 
 * @param {object} ingredient - The ingredient for the current step
 * @param {number} ingredientIndex - Index of the current ingredient
 * @returns {object} Complete weighing workflow state and actions
 */
const useIngredientWeighing = (ingredient, ingredientIndex = 0) => {
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

  // Announce ingredient on mount (replaces legacy useSpeech hook)
  const hasAnnouncedRef = useRef(false);

  useEffect(() => {
    hasAnnouncedRef.current = false;
  }, [ingredient]);

  useEffect(() => {
    if (hasAnnouncedRef.current || !ingredient) return;
    hasAnnouncedRef.current = true;

    const announceIngredient = async () => {
      if (ingredientIndex === 0) {
        await SpeechService.speak(RECIPE_MESSAGES.START_BAKING);
      }

      if (ingredient.stepType === 'weight' && ingredient.requireTare) {
        await SpeechService.speak(SCALE_MESSAGES.TARE_NEEDED);
      }

      let orderMessage;
      if (ingredientIndex === 0) {
        orderMessage = RECIPE_MESSAGES.FIRST_INGREDIENT;
      } else if (ingredientIndex === 1) {
        orderMessage = RECIPE_MESSAGES.SECOND_INGREDIENT;
      } else if (ingredientIndex === 2) {
        orderMessage = RECIPE_MESSAGES.THIRD_INGREDIENT;
      } else {
        orderMessage = RECIPE_MESSAGES.NEXT_INGREDIENT;
      }

      await SpeechService.speak(orderMessage);

      const goalAnnouncement = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
      await SpeechService.speak(goalAnnouncement);

      let instructionLine = ingredient.instructionText?.trim();
      if (!instructionLine || instructionLine === '') {
        if (ingredient.stepType === 'weight') {
          instructionLine = `${INGREDIENT_MESSAGES.INGREDIENT_INSTRUCTION} ${ingredient.name}`;
        } else if (ingredient.stepType === 'weighable') {
          instructionLine = `Place ${ingredient.name} on the scale`;
        }
      }

      if (instructionLine) {
        await SpeechService.speak(instructionLine);
      }
    };

    announceIngredient();

    return () => {
      SpeechService.stop();
    };
  }, [ingredient, ingredientIndex]);

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