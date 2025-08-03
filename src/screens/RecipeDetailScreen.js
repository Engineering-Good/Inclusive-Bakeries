import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { IconButton, Divider, Button } from 'react-native-paper';
import Icon from "react-native-vector-icons/MaterialIcons";
import SpeechService from '../services/SpeechService';
import RecipeService from '../services/RecipeService';
import { RECIPE_MESSAGES } from '../constants/speechText';

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIngredient, setCurrentIngredient] = useState(null);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      const foundRecipe = await RecipeService.getRecipeById(recipeId);
      
      if (foundRecipe) {
        setRecipe(foundRecipe);
        SpeechService.speak(foundRecipe.title);
      } else {
        Alert.alert('Error', 'Recipe not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Could not load recipe');
    } finally {
      setLoading(false);
    }
  };

  const readInstructions = () => {
    if (recipe && recipe.instructions) {
      SpeechService.speakInstructions(recipe.instructions);
    }
  };

  const stopSpeech = () => {
    SpeechService.stop();
  };

  const announceIngredient = (ingredient) => {
    try {
      let displayUnit = ingredient.unit;
      if (displayUnit === 'g') {
        displayUnit = 'grams';
      }
      const announcement = `${ingredient.amount} ${displayUnit} of ${ingredient.name}`;
      SpeechService.speak(announcement);
    } catch (error) {
      console.error('Error announcing ingredient:', error);
    }
  };

  const selectIngredient = (ingredientIndex) => {
    navigation.navigate('Ingredient', {
      ingredientIndex,
      recipe,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Recipe not found</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
  
      </View>

      <View style={styles.imageContainer}>
            <Image
              source={typeof recipe.imageUri === 'string' ? { uri: recipe.imageUri } : recipe.imageUri}
              style={styles.recipeImage}
              // defaultSource={require('../assets/recipes/placeholder.png')}
            />
        </View>
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={() => {
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            selectIngredient(0);
          }
        }}
      >
        <Text style={styles.startButtonText}>Start Baking</Text>
        <Icon
            name={"arrow-forward"}
            size={24}
            color="white"
        />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Ingredients</Text>
      <View style={styles.ingredientsContainer}>
        
      
        {recipe.ingredients && recipe.ingredients
          .filter(ingredient => ingredient.amount || ['g', 'eggs', 'tsp', 'tbsp'].includes(ingredient.unit))
          .map((ingredient, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.ingredientItem}
              onPress={() => selectIngredient(index)}
            >
              <Image
                source={
                  typeof ingredient.imageUri === 'string'
                    ? { uri: ingredient.imageUri }
                    : null
                }
                style={styles.ingredientImage}
              />
              <Text style={styles.ingredientText}>
                {ingredient.name}: {ingredient.amount} {ingredient.unit === 'g' ? 'grams' : ingredient.unit}
              </Text>
              <IconButton
                icon="volume-high"
                size={20}
                onPress={() => announceIngredient(ingredient)}
              />
            </TouchableOpacity>
        ))}
      </View>

      {recipe.instructions && recipe.instructions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsContainer}>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  audioControls: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#FF0000', // Changed from '#4CAF50' to red
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  buttonText: {
    color: '#000000', // Changed from 'white' to black
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
  },
  ingredientsContainer: {
    paddingHorizontal: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 36,
    margin: 18,
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  instructionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    backgroundColor: '#4CAF50',
    color: 'white',
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  backButton: {
    marginTop: 16,
  },
  startButton: {
    alignSelf: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 999, // Ensure button is above other content
    elevation: 5, // Add elevation for Android
    shadowColor: "#000", // Add shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    color: "white",
    fontSize: 50,
    fontWeight: "bold",
    marginRight: 8, // Space between text and icon
  },
    imageContainer: {
    width: 300,
    height: 200, // Same height as recipeImage
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    overflow: 'hidden', // Ensure image doesn't overflow rounded corners
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingLeft: 20, // Padding for better spacing
  },
    recipeImage: {
    width: '100%',
    height: '100%', // Image fills the container
    marginTop: 12,
    resizeMode: 'contain', // Fill the image area, cropping if necessary
  },
});
