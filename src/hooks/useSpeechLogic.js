import { useCallback } from 'react';
import { INGREDIENT_MESSAGES } from '../constants/speechText';

export const useSpeechLogic = (isOverTolerance, isWithinTolerance, progress, isStable) => {
  const getSpeechMessage = useCallback(() => {
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
  }, [isOverTolerance, isWithinTolerance, progress, isStable]);

  return {
    getSpeechMessage,
  };
};
