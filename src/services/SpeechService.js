import * as Speech from 'expo-speech';

class SpeechService {
  speak(text, options = {}) {
    const defaultOptions = {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      ...options
    };
    
    return Speech.speak(text, defaultOptions);
  }
  
  stop() {
    return Speech.stop();
  }
  
  isSpeaking() {
    return Speech.isSpeakingAsync();
  }
  
  // Speaks a list of instructions with pauses between each step
  speakInstructions(instructions, options = {}) {
    let index = 0;
    
    const speakNext = () => {
      if (index < instructions.length) {
        const currentStep = `Step ${index + 1}: ${instructions[index]}`;
        this.speak(currentStep, {
          ...options,
          onDone: () => {
            index++;
            // Add a short pause between instructions
            setTimeout(speakNext, 1000);
          }
        });
      }
    };
    
    speakNext();
  }
  
  // Announce ingredient and its weight
  announceWeight(ingredient, weight, unit = 'grams') {
    const announcement = `${ingredient}: ${weight} ${unit}`;
    return this.speak(announcement);
  }
}

export default new SpeechService();