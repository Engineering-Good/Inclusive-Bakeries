import * as Speech from 'expo-speech';
import { INGREDIENT_MESSAGES, SCALE_MESSAGES } from '../constants/speechText';

class SpeechService {
  constructor() {
    console.log('SpeechService initialized.');
    // Initialize with a female voice if available
    this.initVoice();
    this.SPEECH_DELAY = 2500; // 2.5 seconds delay between instructions
    this.lastSpokenText = null;
    this.lastSpokenTime = 0;
    this.minTimeBetweenSameSpeech = 3000; // Minimum 10 seconds before repeating the exact same speech
  }

  async initVoice() {
    console.log('Initializing voice...');
    const voices = await Speech.getAvailableVoicesAsync();
    // Find a female English voice
    this.preferredVoice = voices.find(voice => 
      voice.language.startsWith('en') && 
      voice.identifier.toLowerCase().includes('female')
    );
    if (this.preferredVoice) {
      console.log('Preferred voice set to:', this.preferredVoice.identifier);
    } else {
      console.log('No preferred female English voice found, using default.');
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
    
    try {
      // Wait if something is already speaking
      // This is crucial to prevent stacking and ensure proper flow
      await this.waitUntilDone();

      // Update last spoken info immediately before speaking
      this.lastSpokenText = text;
      this.lastSpokenTime = now;

      return new Promise((resolve) => { // Removed reject as we'll handle errors gracefully
        const defaultOptions = {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.8,
          voice: this.preferredVoice?.identifier,
          ...options,
          onDone: () => {
            console.log('Speech finished:', text);
            if (options.onDone) options.onDone();
            resolve(); // Resolve the promise when speech is done
          },
          onError: (error) => {
            console.error('Speech error:', error);
            if (options.onError) options.onError(error);
            resolve(); // Resolve the promise even on error to prevent unhandled rejections
          }
        };

        Speech.speak(text, defaultOptions);
      });
    } catch (error) {
      console.error('Speech error in speak method:', error);
      // Do not re-throw here, as the promise within handles resolution/rejection
    }
  }
  
  async stop() {
    console.log('Stopping speech.');
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }
  
  // Helper method to create a delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to wait until speech is done
  async waitUntilDone() {
    let waitIterations = 0;
    while (await Speech.isSpeakingAsync()) {
      await this.delay(100)
      waitIterations++;
      if (waitIterations > 100) { // Timeout after 10 seconds
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
        const currentStep = `Step ${index + 1}: ${instructions[index]}`;
        console.log('Speaking step:', currentStep);
        await this.speak(currentStep, options);
        await this.delay(this.SPEECH_DELAY);
        index++;
        await speakNext();
      } else {
        console.log('Finished speaking all instructions.');
      }
    };
    
    await speakNext();
  }
  
  // // New method to announce ingredient with proper sequence and delays
  // async announceIngredientSequence(ingredient) {
  //   if (!ingredient) {
  //     console.log('No ingredient provided for announceIngredientSequence, returning.');
  //     return; // Guard against null ingredient
  //   }
  //   console.log('Announcing ingredient sequence for:', ingredient.name);
    
  //   try {
  //     // Stop any ongoing speech
  //     await this.stop();

  //     // 1. If tare is required, announce that first
  //     if (ingredient.requireTare) {
  //       console.log('Announcing tare requirement.');
  //       await this.speak(SCALE_MESSAGES.TARE_NEEDED);
  //       await this.delay(this.SPEECH_DELAY); // Delay after speaking
  //     }

  //     // 2. Announce the ingredient name and goal mass
  //     const goalAnnouncement = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
  //     console.log('Announcing goal:', goalAnnouncement);
  //     await this.speak(goalAnnouncement);
  //     await this.delay(this.SPEECH_DELAY); // Delay after speaking

  //     // 3. Announce the custom instruction if available, otherwise use default
  //     const instructionText = ingredient.instructionText && ingredient.instructionText.trim() 
  //       ? ingredient.instructionText 
  //       : `${INGREDIENT_MESSAGES.INGREDIENT_INSTRUCTION} ${ingredient.name}`;
  //     console.log('Announcing instruction:', instructionText);
  //     await this.speak(instructionText);
  //     console.log('Finished announcing ingredient sequence for:', ingredient.name);
  //   } catch (error) {
  //     console.error('Error in announceIngredientSequence:', error);
  //   }
  // }
  
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
    console.log('Announcing ingredient (legacy):', announcement);
    await this.speak(announcement);
  }
}

// Create a singleton instance
const speechService = new SpeechService();
export default speechService;
