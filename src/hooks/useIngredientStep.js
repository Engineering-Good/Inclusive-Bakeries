import { useState, useEffect } from 'react';

const useIngredientStep = (ingredient, progress, isStable) => {
  const [weightReached, setWeightReached] = useState(false);

  useEffect(() => {
    const isWeighable = ingredient.stepType === 'weighable';
    const isInstruction = ingredient.stepType === 'instruction';
    const isWeightBased = ingredient.stepType === 'weight';

    if (isInstruction) {
      setWeightReached(true);
      return;
    }

    if (isWeighable) {
      if (progress > 0.01) {
        setWeightReached(true);
      }
      return;
    }

    if (!isStable) {
      return;
    }

    if (isWeightBased) {
      const targetWeight = parseFloat(ingredient.amount);
      const toleranceGrams = parseFloat(ingredient.tolerance || '0');
      const currentWeight = progress * targetWeight;
      
      const minWeight = targetWeight - toleranceGrams;
      const maxWeight = targetWeight + toleranceGrams;

      setWeightReached(currentWeight >= minWeight && currentWeight <= maxWeight);
    }
  }, [progress, isStable, ingredient]);

  const getBackgroundColor = (progress) => {
    const requireScale = ingredient.unit === "g";
    if (!requireScale) return '#4CAF50'; // Green for non-weight items
    
    const targetWeight = parseFloat(ingredient.amount);
    const toleranceGrams = parseFloat(ingredient.tolerance || '0');
    const currentWeight = progress * targetWeight;
    
    const minWeight = targetWeight - toleranceGrams;
    const maxWeight = targetWeight + toleranceGrams;

    if (currentWeight > maxWeight) return '#0900FF'; // Blue for over
    if (currentWeight >= minWeight) return '#4CAF50'; // Green for perfect
    if (currentWeight >= 0.01 * targetWeight) return '#F44336'; // Red for under
    return '#F44336'; // Red for empty scale
  };

  return { weightReached, getBackgroundColor };
};

export default useIngredientStep;
