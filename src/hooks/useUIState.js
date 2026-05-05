import { useState, useCallback } from 'react';

/**
 * Custom hook to manage UI-specific temporary state.
 * Responsibilities:
 *   - Dialog states (e.g., confirmation dialog)
 *   - Processing flags (e.g., to prevent rapid button presses)
 *   - Any other temporary UI state
 *
 * @returns {object} An object containing UI state and setters.
 */
const useUIState = () => {
  // State for the confirmation dialog
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  // State for button debouncing (to prevent rapid clicks)
  const [isProcessingNext, setIsProcessingNext] = useState(false);

  // Function to reset the processing flag after a delay
  const resetProcessingNextAfterDelay = useCallback((delay = 500) => {
    setTimeout(() => {
      setIsProcessingNext(false);
    }, delay);
  }, []);

  return {
    showConfirmationDialog,
    setShowConfirmationDialog,
    isProcessingNext,
    setIsProcessingNext,
    resetProcessingNextAfterDelay,
  };
};

export default useUIState;