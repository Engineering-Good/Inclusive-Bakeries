import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { createMMKV } from 'react-native-mmkv';

// Module-level singleton for MMKV instance
const storage = createMMKV();

/**
 * Custom hook to handle interruptions and preserve navigation state.
 * Responsibilities:
 *   - AppState listener (background/foreground)
 *   - useFocusEffect for navigation blur/focus
 *   - Persist essential state to MMKV
 *   - Restore state on focus
 *   - Provide saveState and restoreState functions
 *
 * @returns {object} An object containing savedState and isRestored.
 */
const useAppState = () => {
  const [savedState, setSavedState] = useState(null);
  const [isRestored, setIsRestored] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Debounce time for saving state (in milliseconds)
  const STATE_SAVE_DELAY = 1000;

  // Save state to MMKV with debouncing
  const saveState = useCallback((state) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        storage.set('ingredientScreenState', JSON.stringify(state));
        setSavedState(state);
      } catch (error) {
        console.error('Failed to save state to MMKV:', error);
      }
    }, STATE_SAVE_DELAY);
  }, []);

  // Restore state from MMKV
  const restoreState = useCallback(() => {
    try {
      const stateString = storage.getString('ingredientScreenState');
      if (stateString) {
        const state = JSON.parse(stateString);
        setSavedState(state);
        setIsRestored(true);
        return state;
      }
    } catch (error) {
      console.error('Failed to restore state from MMKV:', error);
    }
    return null;
  }, []);

  // AppState listener for background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        // State is saved via saveState calls from components
      }
      if (nextAppState === 'active') {
        // When coming to foreground, attempt to restore state
        const restoredState = restoreState();
        if (restoredState) {
          setIsRestored(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [restoreState]);

  // useFocusEffect for navigation blur/focus
  useFocusEffect(
    useCallback(() => {
      // When the screen gains focus, attempt to restore state
      const restoredState = restoreState();
      if (restoredState) {
        setIsRestored(true);
      }

      return () => {
        // Cleanup runs when screen loses focus
        // Components should call saveState before navigation
      };
    }, [restoreState])
  );

  return {
    savedState,
    isRestored,
    saveState,
    restoreState,
  };
};

export default useAppState;