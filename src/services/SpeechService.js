import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INGREDIENT_MESSAGES, SCALE_MESSAGES } from '../constants/speechText';

const SPEECH_DELAY_KEY = 'speechDelay';
const SPEECH_RATE_KEY = 'speechRate';
const PREFERRED_VOICE_KEY = 'preferredVoiceIdentifier';

class SpeechService {
  constructor() {
    console.log('SpeechService initialized.');
    this.speechDelay = 2500; // Default value
    this.speechRate = 0.7; // Default value
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

      if (storedDelay !== null) {
        this.speechDelay = parseInt(storedDelay, 10);
      }
      if (storedRate !== null) {
        this.speechRate = parseFloat(storedRate);
      }
      this.preferredVoiceIdentifier = storedVoiceIdentifier;
      console.log('Speech settings loaded:', {
        delay: this.speechDelay,
        rate: this.speechRate,
        voice: this.preferredVoiceIdentifier,
      });
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
    console.log('Initializing voices...');
    try {
      this.availableVoices = await Speech.getAvailableVoicesAsync();
      console.log('Available voices fetched:', this.availableVoices.length);

      if (this.preferredVoiceIdentifier) {
        this.preferredVoice = this.availableVoices.find(
          (voice) => voice.identifier === this.preferredVoiceIdentifier
        );
        if (this.preferredVoice) {
          console.log('Preferred voice loaded from storage:', this.preferredVoice.identifier);
        } else {
          console.warn('Stored preferred voice not found among available voices. Using default.');
          this._setDefaultPreferredVoice();
        }
      } else {
        this._setDefaultPreferredVoice();
      }
    } catch (error) {
      console.error('Error fetching available voices:', error);
      this._setDefaultPreferredVoice(); // Fallback to default if fetching fails
    }
  }

  _setDefaultPreferredVoice() {
    this.preferredVoice = this.availableVoices.find(
      (voice) => voice.language.startsWith('en') && voice.identifier.toLowerCase().includes('female')
    );
    if (this.preferredVoice) {
      console.log('Default preferred voice set to:', this.preferredVoice.identifier);
      this.preferredVoiceIdentifier = this.preferredVoice.identifier;
      this._saveSetting(PREFERRED_VOICE_KEY, this.preferredVoiceIdentifier);
    } else {
      console.log('No preferred female English voice found, using first available voice.');
      if (this.availableVoices.length > 0) {
        this.preferredVoice = this.availableVoices[0];
        this.preferredVoiceIdentifier = this.preferredVoice.identifier;
        this._saveSetting(PREFERRED_VOICE_KEY, this.preferredVoiceIdentifier);
      } else {
        console.warn('No voices available on this device.');
      }
    }
  }

  async speak(text, options = {}) {
    if (!text) {
      console.log('Attempted to speak empty text, returning.');
      return; // Don't try to speak empty text
    }

    const now = Date.now();

    // Check for minimum time between same speech
    if (this.lastSpokenText === text && (now - this.lastSpokenTime < this.minTimeBetweenSameSpeech)) {
      console.log(`Too soon to repeat same speech. Skipping: "${text}"`);
      return;
    }

    console.log('Speaking:', text);
    // Update last spoken info immediately before speaking
    this.lastSpokenText = text;
    this.lastSpokenTime = now;
    const words = text.split(' ');

    //Add each word to the speech queue
    this.speechQueue.push(words);
    this.speechQueue.push(' . '); // Add a pause after the sentence

    if (this.isSpeaking) {
      return; // If already speaking, just add to queue
    }

    const optionsWithDefaults = {
      voice: this.preferredVoice ? this.preferredVoice.identifier : undefined,
      language: 'en-GB', // Default language, can be overridden by preferred voice
      pitch: 1.0,
      rate: this.speechRate, // Use configurable speech rate
      ...options, // Merge with any provided options
    };
    this.processSpeechQueue(optionsWithDefaults);
  }

  async processSpeechQueue(options = {}) {
    if (this.isSpeaking) {
      console.log('Already speaking, skipping new speech request.');
      return; // Prevent overlapping speech
    }
    this.isSpeaking = true; // Set speaking flag
    console.log('Processing speech queue. Current queue length:', this.speechQueue.length);
    while (this.speechQueue.length > 0) {
      const word = this.speechQueue.shift(); // Get the next item from the queue

      console.log('Speaking queued text:', word);
      try {
        if (word === ' . ') {
          console.log('Pausing for a moment after sentence.');
          await this.delay(this.speechDelay); // Use configurable speech delay
          continue; // Skip to next item in queue
        }
        await Speech.speak(word, options);
        await this.waitUntilDone(); // Wait until speech is done
      } catch (error) {
        console.error('Error during speech:', error);
      }
    }
    this.isSpeaking = false; // Reset speaking flag
    console.log('Finished processing speech queue.');
  }

  async stop() {
    console.log('Stopping speech.');
    try {
      this.speechQueue = [];
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  // Helper method to create a delay
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper method to wait until speech is done
  async waitUntilDone() {
    let waitIterations = 0;
    while (await Speech.isSpeakingAsync()) {
      await this.delay(100);
      waitIterations++;
      if (waitIterations > 100) {
        // Timeout after 10 seconds
        console.warn('Speech wait timeout exceeded, continuing...');
        break; // Exit the loop
      }
    }
    const waitedMs = waitIterations * 100;
    if (waitedMs > 0) {
      console.log(`Speech is done, continuing... Waited ${waitedMs} ms (${waitIterations} loops).`);
    }
    // Add a small, fixed delay after speech is reported as done to ensure full completion
    await this.delay(150);
  }

  // Speaks a list of instructions with pauses between each step
  async speakInstructions(instructions, options = {}) {
    console.log('Speaking instructions sequence. Total steps:', instructions.length);
    let index = 0;

    const speakNext = async () => {
      if (index < instructions.length) {
        const currentStep = `Step ${index + 1}: ${instructions[index]};`;
        console.log('Speaking step:', currentStep);
        await this.speak(currentStep, options);
        await this.delay(this.speechDelay); // Use configurable speech delay
        index++;
        await speakNext();
      } else {
        console.log('Finished speaking all instructions.');
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
    console.log('Announcing ingredient (legacy):', announcement);
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
      console.log('Preferred voice updated to:', voiceIdentifier);
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
}

// Create a singleton instance
const speechService = new SpeechService();
export default speechService;
