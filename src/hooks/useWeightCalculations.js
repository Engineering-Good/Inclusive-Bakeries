import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Custom hook to manage the weighing workflow state machine.
 * Pure calculation layer - no device or speech logic.
 * 
 * @param {object} ingredient - The ingredient for the current step
 * @param {number} currentWeight - Current weight from scale
 * @param {boolean} isStable - Whether the scale reading is stable
 * @returns {object} Weighing state calculations
 */
const useWeightCalculations = (ingredient, currentWeight, isStable) => {
  const [weightReached, setWeightReached] = useState(false);

  // Calculate weighing metrics
  const {
    targetWeight,
    tolerance,
    minWeight,
    maxWeight,
    isWithinTolerance,
    isOverTolerance,
    progress,
  } = useMemo(() => {
    if (!ingredient) {
      return {
        targetWeight: 0,
        tolerance: 0,
        minWeight: 0,
        maxWeight: 0,
        isWithinTolerance: false,
        isOverTolerance: false,
        progress: 0,
      };
    }

    const requireScale = ingredient.stepType === 'weight' || ingredient.stepType === 'weighable';
    if (!requireScale) {
      return {
        targetWeight: 0,
        tolerance: 0,
        minWeight: 0,
        maxWeight: 0,
        isWithinTolerance: false,
        isOverTolerance: false,
        progress: 0,
      };
    }

    if (ingredient.stepType === 'weighable') {
      // For weighable items (e.g., eggs), any weight > 1g counts
      const reached = currentWeight > 1;
      return {
        targetWeight: 0,
        tolerance: 0,
        minWeight: 0,
        maxWeight: 0,
        isWithinTolerance: reached,
        isOverTolerance: false,
        progress: reached ? 1 : 0,
      };
    }

    // For weight-based ingredients with exact targets
    const target = parseFloat(ingredient.amount) || 0;
    const tol = parseFloat(ingredient.tolerance) || 0;
    const min = target - tol;
    const max = target + tol;
    const within = currentWeight >= min && currentWeight <= max;
    const over = currentWeight > max;
    const prog = target > 0 ? Math.min(currentWeight / target, 1.5) : 0;

    return {
      targetWeight: target,
      tolerance: tol,
      minWeight: min,
      maxWeight: max,
      isWithinTolerance: within,
      isOverTolerance: over,
      progress: prog,
    };
  }, [ingredient, currentWeight]);

  // Determine if weight target has been reached
  useEffect(() => {
    if (!ingredient) {
      setWeightReached(false);
      return;
    }

    let reached = false;
    if (ingredient.stepType === 'weighable') {
      reached = currentWeight > 1;
    } else if (ingredient.stepType === 'weight') {
      reached = isWithinTolerance && isStable;
    }
    setWeightReached(reached);
  }, [ingredient, currentWeight, isStable, isWithinTolerance]);

  // Get background color based on weighing state
  const getBackgroundColor = useCallback(() => {
    if (isOverTolerance) return '#F44336';
    if (weightReached) return '#4CAF50';
    if (currentWeight > 1) return '#F57C00';
    return '#9E9E9E';
  }, [isOverTolerance, weightReached, currentWeight]);

  return {
    weightReached,
    progress,
    targetWeight,
    tolerance,
    minWeight,
    maxWeight,
    isWithinTolerance,
    isOverTolerance,
    getBackgroundColor,
  };
};

export default useWeightCalculations;
