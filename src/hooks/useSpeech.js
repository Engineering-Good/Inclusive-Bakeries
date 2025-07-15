import { useEffect, useRef } from 'react';
import SpeechService from '../services/SpeechService';
import { INGREDIENT_MESSAGES, RECIPE_MESSAGES, SCALE_MESSAGES } from '../constants/speechText';

const useSpeech = (ingredient, ingredientIndex, isLastIngredient) => {
  const instructionRef = useRef("");

  useEffect(() => {
    const announceIngredientOrder = async () => {
      // First ingredient needs the "Let's start baking!" announcement
      if (ingredientIndex === 0) {
        await SpeechService.speak(RECIPE_MESSAGES.START_BAKING);
      }

      // Announce tare if needed for weight-based ingredients
      if (ingredient.stepType === 'weight' && ingredient.requireTare) {
        await SpeechService.speak(SCALE_MESSAGES.TARE_NEEDED);
      }

      // Announce which ingredient number we're on
      let orderMessage;
      if (ingredientIndex === 0) {
        orderMessage = RECIPE_MESSAGES.FIRST_INGREDIENT;
      } else if (ingredientIndex === 1) {
        orderMessage = RECIPE_MESSAGES.SECOND_INGREDIENT;
      } else if (ingredientIndex === 2) {
        orderMessage = RECIPE_MESSAGES.THIRD_INGREDIENT;
      } else {
        orderMessage = RECIPE_MESSAGES.NEXT_INGREDIENT;
      }

      await SpeechService.speak(orderMessage);

      // For weight-based and weighable ingredients, announce the quantity
      if (ingredient.stepType !== 'instruction') {
        const goalAnnouncement = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
        await SpeechService.speak(goalAnnouncement);
        await SpeechService.waitUntilDone();
        await SpeechService.delay(SpeechService.SPEECH_DELAY);
      }

      // Announce the instruction text
      let instructionLine = ingredient.instructionText?.trim();
      if (!instructionLine || instructionLine === '') {
        if (ingredient.stepType === 'weight') {
          instructionLine = `${INGREDIENT_MESSAGES.INGREDIENT_INSTRUCTION} ${ingredient.name}`;
        } else if (ingredient.stepType === 'weighable') {
          instructionLine = `Place ${ingredient.name} on the scale`;
        }
      }

      // Append appropriate final instruction
      instructionLine += isLastIngredient
        ? '. Press finish to complete.'
        : '. Press next when ready.';

      // Save it so we can replay later
      instructionRef.current = instructionLine;

      // Speak it
      await SpeechService.speak(instructionLine);
      await SpeechService.waitUntilDone();
    };

    announceIngredientOrder();

    return () => {
      SpeechService.stop();
    };
  }, [ingredient, ingredientIndex, isLastIngredient]);

  const replayInstruction = () => {
    SpeechService.speak(instructionRef.current);
  };

  return { replayInstruction };
};

export default useSpeech;
