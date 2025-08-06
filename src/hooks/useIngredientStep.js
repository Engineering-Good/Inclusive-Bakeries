import { useState, useEffect, useRef } from 'react';
import useWeighingLogic from './useWeighingLogic';
import SpeechService from '../services/SpeechService';
import { PROMPT_DELAY } from '../constants/speechText';
import { useSpeechLogic } from './useSpeechLogic';

const useIngredientStep = (ingredient, currentWeight, isStable) => {
  const [weightReached, setWeightReached] = useState(false);
  const {
    isWithinTolerance,
    isOverTolerance,
    progress
  } = useWeighingLogic(ingredient, currentWeight);
  const { getSpeechMessage } = useSpeechLogic(isOverTolerance, isWithinTolerance, progress, isStable);
  const timerRef = useRef(null);

  useEffect(() => {
    const isWeighable = ingredient.stepType === 'weighable';
    const isInstruction = ingredient.stepType === 'instruction';

    if (isInstruction) {
      setWeightReached(true);
      return;
    }

    if (isWeighable) {
      if (currentWeight > 1) {
        setWeightReached(true);
      }
      return;
    }

    if (isWithinTolerance && isStable) {
      setWeightReached(true);
    } else {
      setWeightReached(isOverTolerance);
    }
  }, [ingredient, currentWeight, isStable, isWithinTolerance, isOverTolerance]);

  useEffect(() => {
    const message = getSpeechMessage();

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (message) {
      SpeechService.speak(message);

      // Set a new timer to repeat the message
      timerRef.current = setInterval(() => {
        SpeechService.speak(message);
      }, PROMPT_DELAY);
    }

    // Cleanup function to clear the timer when the component unmounts or the message changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [getSpeechMessage]);

  const getBackgroundColor = () => {
    if (isOverTolerance) return '#0900FF'; // Blue for over
    if (weightReached) return '#4CAF50'; // Green for perfect
    if (currentWeight > 1) return '#F44336'; // Red for under
    return '#F44336'; // Red for empty scale
  };

  return { weightReached, getBackgroundColor };
};

export default useIngredientStep;
