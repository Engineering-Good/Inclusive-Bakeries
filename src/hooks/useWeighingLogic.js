import { useMemo } from 'react';

/**
 * Custom hook to perform weighing logic calculations.
 * It calculates the target weight, tolerance, and progress for a given ingredient.
 * @param {object} ingredient - The ingredient to be weighed.
 * @param {number} currentWeight - The current weight measured by the scale.
 * @returns {object} An object containing weighing logic calculations.
 */
const useWeighingLogic = (ingredient, currentWeight) => {
  const {
    targetWeight,
    tolerance,
    minWeight,
    maxWeight,
    isWithinTolerance,
    isOverTolerance,
    progress,
  } = useMemo(() => {
    if (!ingredient || ingredient.stepType !== 'weight') {
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

    const target = parseFloat(ingredient.amount) || 0;
    const tol = parseFloat(ingredient.tolerance) || 0;
    const min = target - tol;
    const max = target + tol;

    const within = currentWeight >= min && currentWeight <= max;
    const over = currentWeight > max;
    const prog = target > 0 ? currentWeight / target : 1.0;

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

  return {
    targetWeight,
    tolerance,
    minWeight,
    maxWeight,
    isWithinTolerance,
    isOverTolerance,
    progress,
  };
};

export default useWeighingLogic;
