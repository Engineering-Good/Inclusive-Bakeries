import { useState, useEffect, useRef, useCallback } from 'react';
import SpeechService from '../services/SpeechService';
import { PROMPT_DELAY } from '../constants/speechText';

/**
 * Custom hook to manage speech coordination with interruption handling.
 * Manages speech queue, replay functionality, and message lifecycle.
 * 
 * @param {string|null} speechMessage - The message to speak (triggers speech when changed)
 * @returns {object} Speech control functions
 */
const useIngredientSpeech = (speechMessage) => {
  const instructionRef = useRef('');
  const timerRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isManualSpeakRef = useRef(false);

  const speak = useCallback((text, options = {}) => {
    const { immediate = false } = options;

    isManualSpeakRef.current = true;
    SpeechService.stop();
    
    if (immediate) {
      SpeechService.speak(text, { immediate: true });
    } else {
      SpeechService.speak(text);
    }
    
    instructionRef.current = text;
    setIsSpeaking(true);

    const checkDone = async () => {
      let attempts = 0;
      while (attempts < 100) {
        const speaking = await SpeechService.isSpeakingAsync().catch(() => false);
        if (!speaking) {
          setIsSpeaking(false);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      setIsSpeaking(false);
    };
    checkDone();
  }, []);

  const replay = useCallback(() => {
    if (instructionRef.current) {
      SpeechService.stop();
      SpeechService.speak(instructionRef.current, { immediate: true });
    }
  }, []);

  const stopAll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    SpeechService.stop();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (isManualSpeakRef.current) {
      isManualSpeakRef.current = false;
      return;
    }

    if (speechMessage) {
      instructionRef.current = speechMessage;

      SpeechService.stop();
      SpeechService.speak(speechMessage, { immediate: true });
      setIsSpeaking(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        SpeechService.speak(speechMessage);
      }, PROMPT_DELAY);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsSpeaking(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      SpeechService.stop();
      setIsSpeaking(false);
    };
  }, [speechMessage]);

  return {
    speak,
    replay,
    stopAll,
    isSpeaking,
  };
};

export default useIngredientSpeech;
