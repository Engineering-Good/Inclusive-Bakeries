import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SpeechService from '../SpeechService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  getAvailableVoicesAsync: jest.fn().mockResolvedValue([]),
}));

describe('SpeechService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    SpeechService.speakWordByWord = false;
    SpeechService.isSpeaking = false;
    SpeechService.speechQueue = [];
    SpeechService.lastSpokenText = null;
    SpeechService.lastSpokenTime = 0;
  });

  afterEach(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('Module import', () => {
    it('should import without syntax errors', () => {
      expect(SpeechService).toBeDefined();
      expect(typeof SpeechService.speak).toBe('function');
      expect(typeof SpeechService.stop).toBe('function');
    });
  });

  describe('Initialization', () => {
    it('should have default speech delay', () => {
      expect(SpeechService.getSpeechDelay()).toBe(2500);
    });

    it('should have default speech rate', () => {
      expect(SpeechService.getSpeechRate()).toBe(0.7);
    });

    it('should have default speakWordByWord as false', () => {
      expect(SpeechService.getSpeakWordByWord()).toBe(false);
    });
  });

  describe('Settings getters/setters', () => {
    it('should set and get speech delay', () => {
      SpeechService.setSpeechDelay(3000);
      expect(SpeechService.getSpeechDelay()).toBe(3000);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('speechDelay', '3000');
    });

    it('should set and get speech rate', () => {
      SpeechService.setSpeechRate(1.0);
      expect(SpeechService.getSpeechRate()).toBe(1.0);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('speechRate', '1');
    });

    it('should set and get speakWordByWord', () => {
      SpeechService.setSpeakWordByWord(true);
      expect(SpeechService.getSpeakWordByWord()).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('speakWordByWord', 'true');
    });

    it('should set preferred voice', () => {
      const mockVoices = [
        { identifier: 'voice-1', name: 'Voice 1', language: 'en-US', gender: 'female', quality: 'default', isDefault: true },
      ];
      SpeechService.availableVoices = mockVoices;

      SpeechService.setPreferredVoice('voice-1');
      expect(SpeechService.getPreferredVoice()).toEqual(mockVoices[0]);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('preferredVoiceIdentifier', 'voice-1');
    });

    it('should warn when setting unknown voice', () => {
      SpeechService.availableVoices = [];
      SpeechService.setPreferredVoice('nonexistent');
      expect(console.warn).toHaveBeenCalledWith('Voice not found:', 'nonexistent');
    });
  });

  describe('speak', () => {
    it('should not speak empty text', async () => {
      await SpeechService.speak('');
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it('should not speak null text', async () => {
      await SpeechService.speak(null);
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it('should stop current speech when immediate is true', async () => {
      await SpeechService.speak('test', { immediate: true });
      expect(Speech.stop).toHaveBeenCalled();
    });

    it('should speak text via Speech.speak', async () => {
      SpeechService.isSpeaking = false;
      SpeechService.speechQueue = [];
      Speech.speak.mockResolvedValue(undefined);
      await SpeechService.speak('hello');
      expect(Speech.speak).toHaveBeenCalledWith('hello', expect.any(Object));
    });

    it('should not repeat same text within minTimeBetweenSameSpeech', async () => {
      SpeechService.lastSpokenText = 'hello';
      SpeechService.lastSpokenTime = Date.now();
      const queueLength = SpeechService.speechQueue.length;
      await SpeechService.speak('hello');
      expect(SpeechService.speechQueue.length).toBe(queueLength);
    });
  });

  describe('stop', () => {
    it('should clear speech queue', async () => {
      SpeechService.speechQueue = ['item1', 'item2'];
      await SpeechService.stop();
      expect(SpeechService.speechQueue).toEqual([]);
    });

    it('should call Speech.stop', async () => {
      await SpeechService.stop();
      expect(Speech.stop).toHaveBeenCalled();
    });

    it('should reset isSpeaking flag', async () => {
      SpeechService.isSpeaking = true;
      await SpeechService.stop();
      expect(SpeechService.isSpeaking).toBe(false);
    });
  });

  describe('processSpeechQueue', () => {
    it('should not process queue if already speaking', async () => {
      SpeechService.isSpeaking = true;
      SpeechService.speechQueue = ['test'];
      await SpeechService.processSpeechQueue();
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it('should handle pause items in queue', async () => {
      SpeechService.isSpeaking = false;
      SpeechService.speechQueue = [' . '];
      await SpeechService.processSpeechQueue();
      expect(Speech.speak).not.toHaveBeenCalled();
    });
  });

  describe('announceIngredient', () => {
    it('should announce weight ingredient in grams', async () => {
      SpeechService.isSpeaking = false;
      SpeechService.speechQueue = [];
      Speech.speak.mockResolvedValue(undefined);
      await SpeechService.announceIngredient('Flour', 200, 'g');
      expect(Speech.speak).toHaveBeenCalledWith('200 grams of Flour', expect.any(Object));
    });

    it('should announce ingredient in teaspoons', async () => {
      SpeechService.isSpeaking = false;
      SpeechService.speechQueue = [];
      Speech.speak.mockResolvedValue(undefined);
      await SpeechService.announceIngredient('Salt', 2, 'tsp');
      expect(Speech.speak).toHaveBeenCalledWith('2 teaspoons of Salt', expect.any(Object));
    });

    it('should announce count-based ingredient', async () => {
      SpeechService.isSpeaking = false;
      SpeechService.speechQueue = [];
      Speech.speak.mockResolvedValue(undefined);
      await SpeechService.announceIngredient('Eggs', 3, 'count');
      expect(Speech.speak).toHaveBeenCalledWith('3 Eggs', expect.any(Object));
    });
  });

  describe('speakInstructions', () => {
    it('should speak each instruction with step prefix', async () => {
      SpeechService.isSpeaking = false;
      SpeechService.speechQueue = [];
      SpeechService.speechDelay = 100;
      Speech.speak.mockResolvedValue(undefined);
      const instructions = ['Mix ingredients', 'Bake for 30 minutes'];
      await SpeechService.speakInstructions(instructions);
      expect(Speech.speak).toHaveBeenCalledWith('Step 1: Mix ingredients;', expect.any(Object));
      expect(Speech.speak).toHaveBeenCalledWith('Step 2: Bake for 30 minutes;', expect.any(Object));
    });
  });

  describe('delay', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await SpeechService.delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('Voice processing', () => {
    it('should return available voices', () => {
      const voices = SpeechService.getAvailableVoices();
      expect(Array.isArray(voices)).toBe(true);
    });
  });
});
