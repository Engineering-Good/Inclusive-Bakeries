import { useState, useEffect, useRef } from 'react';
import useWeighingLogic from './useWeighingLogic';
import SpeechService from '../services/SpeechService';
import { PROMPT_DELAY } from '../constants/speechText';
import { useSpeechLogic } from './useSpeechLogic';

const useIngredientStep = (ingredient, currentWeight, isStable, isFinalStep) => {
  const [weightReached, setWeightReached] = useState(false);
  const {
    isWithinTolerance,
    isOverTolerance,
    progress
  } = useWeighingLogic(ingredient, currentWeight);
  const { getSpeechMessage } = useSpeechLogic(isOverTolerance, isWithinTolerance, progress, isStable, isFinalStep);
  const timerRef = useRef(null);

  useEffect(() => {
    const isWeighable = ingredient.stepType === 'weighable';

    if (isWeighable) {
      if (currentWeight > 1) {
        setWeightReached(true);
      }
      return;
    }

    if (isWithinTolerance && isStable) {
      setWeightReached(true);
    } else {
      // setWeightReached(isOverTolerance);
      setWeightReached(false);
    }
  }, [ingredient, currentWeight, isStable, isWithinTolerance, isOverTolerance]);

  const message = getSpeechMessage();

  useEffect(() => {
    // Clear any existing timer when the message changes.
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (message) {
      // Speak the new message immediately.
      SpeechService.speak(message, { immediate: true });

      // Set a new timer to repeat the message.
      timerRef.current = setInterval(() => {
        SpeechService.speak(message);
      }, PROMPT_DELAY);
    } else {
      // If there's no message, stop all speech.
      SpeechService.stop();
    }

    // Cleanup function to clear the timer when the component unmounts or the message changes.
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      SpeechService.stop();
    };
  }, [message]); // Depend on the message string itself.

  const getBackgroundColor = () => {
    if (isOverTolerance) return '#F44336'; // Red for over
    if (isOverTolerance) return '#F44336'; // Red for over
    if (weightReached) return '#4CAF50'; // Green for perfect
    if (currentWeight > 1) return '#F57C00'; // Yellow for under
    return '#9E9E9E'; // Grey for empty scale
  };

  return { weightReached, getBackgroundColor };
};

export default useIngredientStep;
