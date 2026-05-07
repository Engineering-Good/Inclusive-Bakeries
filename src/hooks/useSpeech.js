import { useEffect, useRef } from 'react';
import SpeechService from '../services/SpeechService';
import { RECIPE_MESSAGES, SCALE_MESSAGES } from '../constants/speechText';

/**
 * Custom hook to manage speech synthesis for ingredient instructions.
 * It announces the ingredient, its quantity, and the instructions for the current step.
 * @param {object} ingredient - The ingredient for the current step.
 * @param {number} ingredientIndex - The index of the current ingredient in the recipe.
 * @param {boolean} isLastIngredient - A boolean indicating if this is the last ingredient.
 * @returns {object} An object containing a `replayInstruction` function.
 */
const useSpeech = (ingredient, ingredientIndex, isLastIngredient) => {
  const instructionRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    const announceIngredientOrder = async () => {
      // Take ownership of the speech channel and wait briefly so that any
      // cleanup effects from the previous screen (which also call stop()) have
      // a chance to fire before we begin speaking.  Because stop() now resets
      // the deduplication timer, those subsequent stop() calls are no-ops and
      // cannot silence our upcoming audio.
      SpeechService.stop();
      await SpeechService.delay(150);
      if (cancelled) return;

      // First ingredient needs the "Let's start baking!" announcement
      if (ingredientIndex === 0) {
        await SpeechService.speak(RECIPE_MESSAGES.START_BAKING);
        if (cancelled) return;
      }

      // Announce tare if needed for weight-based ingredients
      if (ingredient.stepType === 'weight' && ingredient.requireTare) {
        await SpeechService.speak(SCALE_MESSAGES.TARE_NEEDED);
        if (cancelled) return;
      }

      // Announce which ingredient number we're on
      let orderMessage;
      if (isLastIngredient) {
        orderMessage = RECIPE_MESSAGES.LAST_INGREDIENT;
      } else if (ingredientIndex === 0) {
        orderMessage = RECIPE_MESSAGES.FIRST_INGREDIENT;
      } else if (ingredientIndex === 1) {
        orderMessage = RECIPE_MESSAGES.SECOND_INGREDIENT;
      } else if (ingredientIndex === 2) {
        orderMessage = RECIPE_MESSAGES.THIRD_INGREDIENT;
      } else {
        orderMessage = RECIPE_MESSAGES.NEXT_INGREDIENT;
      }

      await SpeechService.speak(orderMessage);
      if (cancelled) return;

      // For weight-based and weighable ingredients, announce the quantity.
      // Omit "of [name]" when the unit already is the ingredient (e.g. "2 eggs", not "2 eggs of eggs").
      const goalAnnouncement = ingredient.unit.toLowerCase() === ingredient.name.toLowerCase()
        ? `${ingredient.amount} ${ingredient.unit}`
        : `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
      await SpeechService.speak(goalAnnouncement);
      if (cancelled) return;
      await SpeechService.waitUntilDone();
      await SpeechService.delay(SpeechService.speechDelay);
      if (cancelled) return;

      // Announce the instruction text
      let instructionLine = ingredient.instructionText?.trim();
      if (!instructionLine || instructionLine === '') {
        if (ingredient.stepType === 'weight') {
          instructionLine = `${INGREDIENT_MESSAGES.INGREDIENT_INSTRUCTION} ${ingredient.name}`;
        } else if (ingredient.stepType === 'weighable') {
          instructionLine = `Place ${ingredient.name} on the scale`;
        }
      }

      // Save the instruction for replay without the navigation cue so that
      // tapping the volume icon only repeats the actual step instruction.
      instructionRef.current = instructionLine;

      // Speak the instruction
      await SpeechService.speak(instructionLine);
      if (cancelled) return;
      await SpeechService.waitUntilDone();
    };

    announceIngredientOrder();

    return () => {
      cancelled = true;
      SpeechService.stop();
    };
  }, [ingredient, ingredientIndex, isLastIngredient]);

  const replayInstruction = () => {
    SpeechService.speak(instructionRef.current);
  };

  return { replayInstruction };
};

export default useSpeech;
