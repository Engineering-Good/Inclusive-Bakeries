import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SpeechService from '../services/SpeechService';

const CelebrationScreen = ({ route, navigation }) => {
  useEffect(() => {
    SpeechService.speak("Congratulations! You have completed the recipe!");
    // Configure the navigation header
    navigation.setOptions({
        headerLeft: () => null, // Remove back button
        //headerTitle: 'Completed!',
    });
    }, [navigation]);

  const handleBackToRecipes = () => {
    navigation.navigate('Recipes'); // Navigate to the recipe list screen
  };


  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/complete.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>🎉 Congratulations! 🎉</Text>
          <Text style={styles.subtitle}>You've completed the recipe!</Text>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleBackToRecipes}
        >
          <Icon name="list" size={24} color="white" />
          <Text style={styles.buttonText}>Back to Recipes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
      },
      backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
      },
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // semi-transparent white overlay
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        alignItems: 'center',
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
      subtitle: {
        fontSize: 24,
        color: '#666',
        marginBottom: 40,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
      button: {
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
        elevation: 3, // for Android shadow
        shadowColor: '#000', // for iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
      },
});

export default CelebrationScreen;
