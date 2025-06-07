import * as Speech from 'expo-speech';
import { INGREDIENT_MESSAGES, SCALE_MESSAGES } from '../constants/speechText';

class SpeechService {
  constructor() {
    // Initialize with a female voice if available
    this.initVoice();
    this.SPEECH_DELAY = 3000; // 3 seconds delay between instructions
    this.isSpeaking = false;
  }

  async initVoice() {
    const voices = await Speech.getAvailableVoicesAsync();
    // Find a female English voice
    this.preferredVoice = voices.find(voice => 
      voice.language.startsWith('en') && 
      voice.identifier.toLowerCase().includes('female')
    );
  }

  async speak(text, options = {}) {
    if (!text) return; // Don't try to speak empty text
    
    try {
      // Wait if something is already speaking
      while (this.isSpeaking) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.isSpeaking = true;
      await Speech.stop(); // Ensure any previous speech is stopped

      const defaultOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        voice: this.preferredVoice?.identifier,
        ...options,
        onDone: () => {
          this.isSpeaking = false;
          if (options.onDone) options.onDone();
        },
        onError: (error) => {
          this.isSpeaking = false;
          console.error('Speech error:', error);
          if (options.onError) options.onError(error);
        }
      };

      return await Speech.speak(text, defaultOptions);
    } catch (error) {
      this.isSpeaking = false;
      console.error('Speech error:', error);
    }
  }
  
  async stop() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }
  
  isSpeakingAsync() {
    return Speech.isSpeakingAsync();
  }

  // Helper method to create a delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to wait until speech is done
  async waitUntilDone() {
    while (this.isSpeaking) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Speaks a list of instructions with pauses between each step
  async speakInstructions(instructions, options = {}) {
    let index = 0;
    
    const speakNext = async () => {
      if (index < instructions.length) {
        const currentStep = `Step ${index + 1}: ${instructions[index]}`;
        await this.speak(currentStep, options);
        await this.waitUntilDone();
        await this.delay(this.SPEECH_DELAY);
        index++;
        await speakNext();
      }
    };
    
    await speakNext();
  }
  
  // New method to announce ingredient with proper sequence and delays
  async announceIngredientSequence(ingredient) {
    if (!ingredient) return; // Guard against null ingredient
    
    try {
      // Stop any ongoing speech
      await this.stop();

      // 1. If tare is required, announce that first
      if (ingredient.requireTare) {
        await this.speak(SCALE_MESSAGES.TARE_NEEDED);
        await this.waitUntilDone();
        await this.delay(this.SPEECH_DELAY);
      }

      // 2. Announce the ingredient name and goal mass
      const goalAnnouncement = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
      await this.speak(goalAnnouncement);
      await this.waitUntilDone();
      await this.delay(this.SPEECH_DELAY);

      // 3. Announce the custom instruction if available, otherwise use default
      const instructionText = ingredient.instructionText && ingredient.instructionText.trim() 
        ? ingredient.instructionText 
        : `${INGREDIENT_MESSAGES.INGREDIENT_INSTRUCTION} ${ingredient.name}`;
      await this.speak(instructionText);
      await this.waitUntilDone();
    } catch (error) {
      console.error('Error in announceIngredientSequence:', error);
      this.isSpeaking = false;
    }
  }
  
  // Legacy method for backward compatibility
  async announceIngredient(ingredientName, amount, unit) {
    let announcement;
    if (unit === 'g') {
      announcement = `${amount} grams of ${ingredientName}`;
    } else if (unit === 'tsp') {
      announcement = `${amount} teaspoons of ${ingredientName}`;
    } else { // Implies count-based
      announcement = `${amount} ${ingredientName}`;
    }
    await this.speak(announcement);
    await this.waitUntilDone();
  }
}

// Create a singleton instance
const speechService = new SpeechService();
export default speechService;
