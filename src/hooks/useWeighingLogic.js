import { useMemo, useRef } from 'react';

// Floor for the hysteresis buffer so very tight tolerances still get some
// noise immunity; scaled tolerances use 20% of the tolerance instead.
const MIN_HYSTERESIS_BUFFER = 0.3;

/**
 * Custom hook to perform weighing logic calculations.
 * It calculates the target weight, tolerance, and progress for a given ingredient.
 * @param {object} ingredient - The ingredient to be weighed.
 * @param {number} currentWeight - The current weight measured by the scale.
 * @returns {object} An object containing weighing logic calculations.
 */
const useWeighingLogic = (ingredient, currentWeight) => {
  // Sticky zone ('UNDER' | 'WITHIN' | 'OVER') so sensor noise that crosses
  // the min/max line by less than the hysteresis buffer doesn't flip the
  // reported tolerance state back and forth.
  const zoneRef = useRef('UNDER');
  const lastIngredientKeyRef = useRef(null);

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
      zoneRef.current = 'UNDER';
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
    const buffer = Math.max(MIN_HYSTERESIS_BUFFER, tol * 0.2);

    const ingredientKey = `${ingredient.name}-${target}-${tol}`;
    if (lastIngredientKeyRef.current !== ingredientKey) {
      zoneRef.current = 'UNDER';
      lastIngredientKeyRef.current = ingredientKey;
    }

    // Only cross a boundary once the raw weight passes it by more than
    // `buffer`, so noise near the edge doesn't flip the zone repeatedly.
    let zone = zoneRef.current;
    if (zone === 'WITHIN') {
      if (currentWeight < min - buffer) {
        zone = 'UNDER';
      } else if (currentWeight > max + buffer) {
        zone = 'OVER';
      }
    } else if (zone === 'OVER') {
      if (currentWeight <= max) {
        zone = 'WITHIN';
      }
    } else {
      if (currentWeight >= min && currentWeight <= max) {
        zone = 'WITHIN';
      } else if (currentWeight > max) {
        zone = 'OVER';
      }
    }
    zoneRef.current = zone;

    const within = zone === 'WITHIN';
    const over = zone === 'OVER';
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
