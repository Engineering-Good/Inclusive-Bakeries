import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INGREDIENT_MESSAGES, SCALE_MESSAGES } from '../constants/speechText';

const SPEECH_DELAY_KEY = 'speechDelay';
const SPEECH_RATE_KEY = 'speechRate';
const PREFERRED_VOICE_KEY = 'preferredVoiceIdentifier';
const SPEAK_WORD_BY_WORD_KEY = 'speakWordByWord';

class SpeechService {
  constructor() {
    this.speechDelay = 2500; // Default value
    this.speechRate = 0.7; // Default value
    this.speakWordByWord = false; // Default value
    this.preferredVoice = null;
    this.availableVoices = [];
    this.lastSpokenText = null;
    this.lastSpokenTime = 0;
    this.minTimeBetweenSameSpeech = 3000;
    this.speechQueue = []; // Queue for speech requests
    this.isSpeaking = false; // Flag to indicate if speech is currently playing

    this._loadSettings();
    this._initVoices();
  }

  async _loadSettings() {
    try {
      const storedDelay = await AsyncStorage.getItem(SPEECH_DELAY_KEY);
      const storedRate = await AsyncStorage.getItem(SPEECH_RATE_KEY);
      const storedVoiceIdentifier = await AsyncStorage.getItem(PREFERRED_VOICE_KEY);
      const storedSpeakWordByWord = await AsyncStorage.getItem(SPEAK_WORD_BY_WORD_KEY);

      if (storedDelay !== null) {
        this.speechDelay = parseInt(storedDelay, 10);
      }
      if (storedRate !== null) {
        this.speechRate = parseFloat(storedRate);
      }
      if (storedSpeakWordByWord !== null) {
        this.speakWordByWord = storedSpeakWordByWord === 'true';
      }
      // Ensure preferredVoiceIdentifier is not null for debugging/initial load
      this.preferredVoiceIdentifier = storedVoiceIdentifier || '';
    } catch (error) {
      console.error('Error loading speech settings:', error);
    }
  }

  async _saveSetting(key, value) {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
    }
  }

  async _initVoices() {
    try {
      const allVoices = await Speech.getAvailableVoicesAsync();
      this.availableVoices = this._processVoices(allVoices);

      if (this.preferredVoiceIdentifier) {
        this.preferredVoice = this.availableVoices.find(
          (voice) => voice.identifier === this.preferredVoiceIdentifier
        );
        if (!this.preferredVoice) {
          console.warn('Stored preferred voice not found among available voices. Using default.');
          this._setDefaultPreferredVoice();
        }
      } else {
        this._setDefaultPreferredVoice();
      }
    } catch (error) {
      console.error('Error fetching or processing available voices:', error);
      this._setDefaultPreferredVoice();
    }
  }

  _processVoices(voices) {
    const englishVoices = voices.filter(voice => voice.language.startsWith('en'));
    const processedVoices = [];
    let maleCount = 1;
    let femaleCount = 1;

    englishVoices.forEach(voice => {
      const lowerCaseIdentifier = voice.identifier.toLowerCase();
      const lowerCaseName = voice.name.toLowerCase();
      let gender = 'unknown';
      let label = voice.identifier; // Default to identifier

      if (lowerCaseIdentifier.includes('female') || lowerCaseName.includes('female')) {
        gender = 'female';
        label = `English Female Voice ${femaleCount++}`;
      } else if (lowerCaseIdentifier.includes('male') || lowerCaseName.includes('male')) {
        gender = 'male';
        label = `English Male Voice ${maleCount++}`;
      } else if (lowerCaseIdentifier.includes('f') && !lowerCaseIdentifier.includes('m')) {
        // Heuristic for voices like 'en-us-x-fnc-network'
        gender = 'female';
        label = `English Female Voice ${femaleCount++}`;
      } else if (lowerCaseIdentifier.includes('m') && !lowerCaseIdentifier.includes('f')) {
        // Heuristic for voices like 'en-us-x-msc-network'
        gender = 'male';
        label = `English Male Voice ${maleCount++}`;
      }

      processedVoices.push({
        identifier: voice.identifier,
        name: label, // Use the user-friendly label
        language: voice.language,
        gender: gender,
        quality: voice.quality,
        isDefault: voice.isDefault,
      });
    });

    // Sort voices for consistent display, e.g., females first, then males
    processedVoices.sort((a, b) => {
      if (a.gender === 'female' && b.gender !== 'female') return -1;
      if (a.gender !== 'female' && b.gender === 'female') return 1;
      return a.name.localeCompare(b.name);
    });

    return processedVoices;
  }

  _setDefaultPreferredVoice() {
    // Try to find a female English voice first
    this.preferredVoice = this.availableVoices.find(
      (voice) => voice.language.startsWith('en') && voice.gender === 'female'
    );

    if (this.preferredVoice) {
      this.preferredVoiceIdentifier = this.preferredVoice.identifier;
      this._saveSetting(PREFERRED_VOICE_KEY, this.preferredVoiceIdentifier);
    } else {
      // If no female voice, try to find any English voice
      this.preferredVoice = this.availableVoices.find(
        (voice) => voice.language.startsWith('en')
      );
      if (this.preferredVoice) {
        this.preferredVoiceIdentifier = this.preferredVoice.identifier;
        this._saveSetting(PREFERRED_VOICE_KEY, this.preferredVoiceIdentifier);
      } else {
        if (this.availableVoices.length > 0) {
          this.preferredVoice = this.availableVoices[0];
          this.preferredVoiceIdentifier = this.preferredVoice.identifier;
          this._saveSetting(PREFERRED_VOICE_KEY, this.preferredVoiceIdentifier);
        } else {
          console.warn('No voices available on this device.');
        }
      }
    }
  }

  async speak(text, options = {}) {
    const { immediate = false, ...speechOptions } = options;

    if (immediate) {
      await this.stop();
    }
    if (!text) {
      return; // Don't try to speak empty text
    }

    const now = Date.now();

    // Check for minimum time between same speech
    if (this.lastSpokenText === text && (now - this.lastSpokenTime < this.minTimeBetweenSameSpeech)) {
      return;
    }

    // Update last spoken info immediately before speaking
    this.lastSpokenText = text;
    this.lastSpokenTime = now;


    // Check settings to see if we should split text into words. If speakWordByWord is false, we will speak the entire text as one sentence.
    if (this.speakWordByWord) {
      const words = text.split(' ');
      // Add each word to the speech queue
      this.speechQueue.push(...words);
    } else {
      // Add the entire text as one item to the speech queue
      this.speechQueue.push(text);
    }
    
    this.speechQueue.push(' . '); // Add a pause after the sentence

    if (this.isSpeaking) {
      return; // If already speaking, just add to queue
    }

    const optionsWithDefaults = {
      voice: this.preferredVoice ? this.preferredVoice.identifier : undefined,
      language: 'en-GB', // Default language, can be overridden by preferred voice
      pitch: 1.0,
      rate: this.speechRate, // Use configurable speech rate
      ...speechOptions, // Merge with any provided options
    };

    await this.processSpeechQueue(optionsWithDefaults);
  }

  async processSpeechQueue(options = {}) {
    if (this.isSpeaking) {
      return; // Prevent overlapping speech
    }
    this.isSpeaking = true; // Set speaking flag
    while (this.speechQueue.length > 0) {
      const item = this.speechQueue.shift(); // Get the next item from the queue (could be a word or a full sentence)

      try {
        if (item === ' . ') {
          await this.delay(this.speechDelay); // Use configurable speech delay
          continue; // Skip to next item in queue
        }
        await Speech.speak(item, options);
        let waitIterations = 0;
        while (await Speech.isSpeakingAsync()) {
          await this.delay(100);
          waitIterations++;
          if (waitIterations > 100) {
            console.warn('Speech wait timeout exceeded, continuing...');
            break;
          }
        }
        await this.delay(150);
      } catch (error) {
        console.error('Error during speech:', error);
      }
    }
    this.isSpeaking = false; // Reset speaking flag
  }

  async stop() {
    try {
      this.speechQueue = [];
      await Speech.stop();
      this.isSpeaking = false; // Reset speaking flag
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  // Helper method to create a delay
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Speaks a list of instructions with pauses between each step
  async speakInstructions(instructions, options = {}) {
    let index = 0;

    const speakNext = async () => {
      if (index < instructions.length) {
        const currentStep = `Step ${index + 1}: ${instructions[index]};`;
        await this.speak(currentStep, options);
        await this.delay(this.speechDelay);
        index++;
        await speakNext();
      }
    };

    await speakNext();
  }

  // Legacy method for backward compatibility
  async announceIngredient(ingredientName, amount, unit) {
    let announcement;
    if (unit === 'g') {
      announcement = `${amount} grams of ${ingredientName}`;
    } else if (unit === 'tsp') {
      announcement = `${amount} teaspoons of ${ingredientName}`;
    } else {
      // Implies count-based
      announcement = `${amount} ${ingredientName}`;
    }
    await this.speak(announcement);
  }

  // Public getters and setters for speech settings
  setSpeechDelay(delay) {
    this.speechDelay = delay;
    this._saveSetting(SPEECH_DELAY_KEY, delay);
  }

  getSpeechDelay() {
    return this.speechDelay;
  }

  setSpeechRate(rate) {
    this.speechRate = rate;
    this._saveSetting(SPEECH_RATE_KEY, rate);
  }

  getSpeechRate() {
    return this.speechRate;
  }

  setPreferredVoice(voiceIdentifier) {
    const voice = this.availableVoices.find((v) => v.identifier === voiceIdentifier);
    if (voice) {
      this.preferredVoice = voice;
      this.preferredVoiceIdentifier = voiceIdentifier;
      this._saveSetting(PREFERRED_VOICE_KEY, voiceIdentifier);
    } else {
      console.warn('Voice not found:', voiceIdentifier);
    }
  }

  getPreferredVoice() {
    return this.preferredVoice;
  }

  getAvailableVoices() {
    return this.availableVoices;
  }

  setSpeakWordByWord(value) {
    this.speakWordByWord = value;
    this._saveSetting(SPEAK_WORD_BY_WORD_KEY, value);
  }

  getSpeakWordByWord() {
    return this.speakWordByWord;
  }
}

// Create a singleton instance
const speechService = new SpeechService();
export default speechService;
