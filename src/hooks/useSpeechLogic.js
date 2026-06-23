import { useCallback } from 'react';
import { INGREDIENT_MESSAGES } from '../constants/speechText';

export const useSpeechLogic = (isOverTolerance, isWithinTolerance, progress, isStable, isFinalStep, weightReached) => {
  const getSpeechMessage = useCallback(() => {
    if (isOverTolerance) {
      return INGREDIENT_MESSAGES.TOO_MUCH;
    }
    // `weightReached` is a latch: once set, a transient instability blip
    // while still within tolerance must not revert this back to "Add
    // slowly"/"Add more". The raw check is kept alongside it so the
    // announcement still fires immediately the first time, with no lag.
    if (weightReached || (isWithinTolerance && isStable)) {
      return isFinalStep ? INGREDIENT_MESSAGES.WELL_DONE_FINISH : INGREDIENT_MESSAGES.WELL_DONE;
    }
    if (isWithinTolerance || progress >= 0.8) {
      return INGREDIENT_MESSAGES.ADD_SLOWLY;
    }
    if (progress > 0) {
      return INGREDIENT_MESSAGES.ADD_MORE;
    }
    return null;
  }, [isOverTolerance, isWithinTolerance, progress, isStable, isFinalStep, weightReached]);

  return {
    getSpeechMessage,
  };
};
