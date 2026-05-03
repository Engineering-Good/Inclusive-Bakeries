import { renderHook, waitFor } from '@testing-library/react-native';
import SpeechService from '../../services/SpeechService';
import ScaleServiceFactory from '../../services/ScaleServiceFactory';
import useIngredientWeighing from '../useIngredientWeighing';
import { RECIPE_MESSAGES, SCALE_MESSAGES, INGREDIENT_MESSAGES } from '../../constants/speechText';

jest.mock('../../services/SpeechService', () => ({
  speak: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  waitUntilDone: jest.fn().mockResolvedValue(undefined),
  delay: jest.fn().mockResolvedValue(undefined),
  getSpeechDelay: jest.fn().mockReturnValue(2500),
  SPEECH_DELAY: 2500,
}));

jest.mock('../../services/ScaleServiceFactory', () => ({
  getScaleService: jest.fn().mockResolvedValue({
    subscribe: jest.fn(() => jest.fn()),
    setActive: jest.fn(),
  }),
  isMockScaleSelected: jest.fn().mockResolvedValue(true),
  getConnectionStatus: jest.fn().mockReturnValue({ isConnected: true }),
  subscribeToWeightUpdates: jest.fn(() => jest.fn()),
  unsubscribeAll: jest.fn(),
}));

const mockIngredient = {
  name: 'Flour',
  amount: 200,
  unit: 'g',
  stepType: 'weight',
  requireTare: true,
  instructionText: 'Sift the flour before adding',
};

const mockWeighableIngredient = {
  name: 'Egg',
  amount: 2,
  unit: 'eggs',
  stepType: 'weighable',
  requireTare: false,
  instructionText: '',
};

describe('useIngredientWeighing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ingredient announcement on mount', () => {
    it('should speak "Let\'s start baking!" for the first ingredient (index 0)', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith(RECIPE_MESSAGES.START_BAKING);
      });
    });

    it('should NOT speak "Let\'s start baking!" for non-first ingredients', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 1));

      await waitFor(() => {
        expect(SpeechService.speak).not.toHaveBeenCalledWith(RECIPE_MESSAGES.START_BAKING);
      });
    });

    it('should speak "Please tare the scale" when ingredient requires tare', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith(SCALE_MESSAGES.TARE_NEEDED);
      });
    });

    it('should NOT speak "Please tare the scale" when ingredient does not require tare', async () => {
      renderHook(() => useIngredientWeighing(mockWeighableIngredient, 0));

      await waitFor(() => {
        expect(SpeechService.speak).not.toHaveBeenCalledWith(SCALE_MESSAGES.TARE_NEEDED);
      });
    });

    it('should announce the correct ingredient order message for index 0', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith(RECIPE_MESSAGES.FIRST_INGREDIENT);
      });
    });

    it('should announce the correct ingredient order message for index 1', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 1));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith(RECIPE_MESSAGES.SECOND_INGREDIENT);
      });
    });

    it('should announce the correct ingredient order message for index 2', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 2));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith(RECIPE_MESSAGES.THIRD_INGREDIENT);
      });
    });

    it('should announce "Next ingredient" for index 3 and beyond', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 3));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith(RECIPE_MESSAGES.NEXT_INGREDIENT);
      });
    });

    it('should announce the ingredient amount and name', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith('200 g of Flour');
      });
    });

    it('should speak the ingredient instruction text when provided', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith('Sift the flour before adding');
      });
    });

    it('should generate default instruction for weight-based ingredients when no instructionText', async () => {
      const ingredientWithoutInstruction = { ...mockIngredient, instructionText: '' };
      renderHook(() => useIngredientWeighing(ingredientWithoutInstruction, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith(
          `${INGREDIENT_MESSAGES.INGREDIENT_INSTRUCTION} Flour`
        );
      });
    });

    it('should generate default instruction for weighable ingredients when no instructionText', async () => {
      const weighableWithoutInstruction = { ...mockWeighableIngredient, instructionText: '' };
      renderHook(() => useIngredientWeighing(weighableWithoutInstruction, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith('Place Egg on the scale');
      });
    });

    it('should announce in correct order: START_BAKING -> TARE_NEEDED -> ORDER -> AMOUNT -> INSTRUCTION', async () => {
      renderHook(() => useIngredientWeighing(mockIngredient, 0));

      await waitFor(() => {
        const calls = SpeechService.speak.mock.calls.map(call => call[0]);
        expect(calls).toContain(RECIPE_MESSAGES.START_BAKING);
        expect(calls).toContain(SCALE_MESSAGES.TARE_NEEDED);
        expect(calls).toContain(RECIPE_MESSAGES.FIRST_INGREDIENT);
        expect(calls).toContain('200 g of Flour');
        expect(calls).toContain('Sift the flour before adding');

        const startIndex = calls.indexOf(RECIPE_MESSAGES.START_BAKING);
        const tareIndex = calls.indexOf(SCALE_MESSAGES.TARE_NEEDED);
        const orderIndex = calls.indexOf(RECIPE_MESSAGES.FIRST_INGREDIENT);
        const amountIndex = calls.indexOf('200 g of Flour');
        const instructionIndex = calls.indexOf('Sift the flour before adding');

        expect(startIndex).toBeLessThan(tareIndex);
        expect(tareIndex).toBeLessThan(orderIndex);
        expect(orderIndex).toBeLessThan(amountIndex);
        expect(amountIndex).toBeLessThan(instructionIndex);
      });
    });
  });

  describe('re-announcement on ingredient change', () => {
    it('should re-announce when ingredient changes', async () => {
      const { rerender } = renderHook(
        ({ ingredient, index }) => useIngredientWeighing(ingredient, index),
        { initialProps: { ingredient: mockIngredient, index: 0 } }
      );

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith('200 g of Flour');
      });

      SpeechService.speak.mockClear();

      const newIngredient = {
        ...mockIngredient,
        name: 'Sugar',
        amount: 100,
      };

      rerender({ ingredient: newIngredient, index: 0 });

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalledWith('100 g of Sugar');
      });
    });

    it('should stop previous speech when ingredient changes', async () => {
      const { rerender } = renderHook(
        ({ ingredient, index }) => useIngredientWeighing(ingredient, index),
        { initialProps: { ingredient: mockIngredient, index: 0 } }
      );

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalled();
      });

      SpeechService.stop.mockClear();

      const newIngredient = { ...mockIngredient, name: 'Sugar' };
      rerender({ ingredient: newIngredient, index: 0 });

      await waitFor(() => {
        expect(SpeechService.stop).toHaveBeenCalled();
      });
    });
  });

  describe('speech cleanup on unmount', () => {
    it('should stop speech when component unmounts', async () => {
      const { unmount } = renderHook(() => useIngredientWeighing(mockIngredient, 0));

      await waitFor(() => {
        expect(SpeechService.speak).toHaveBeenCalled();
      });

      SpeechService.stop.mockClear();
      unmount();

      expect(SpeechService.stop).toHaveBeenCalled();
    });
  });
});
