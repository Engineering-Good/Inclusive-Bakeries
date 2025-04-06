import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SpeechService from '../services/SpeechService';

const CelebrationScreen = () => {
  useEffect(() => {
    SpeechService.speak("Congratulations! You've completed the recipe!");
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Congratulations! 🎉</Text>
      <Text style={styles.subtitle}>You've completed the recipe!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    color: '#666',
  },
});

export default CelebrationScreen;
