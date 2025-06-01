import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
=======
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
import { IconButton, Divider, Button } from 'react-native-paper';
import SpeechService from '../services/SpeechService';
import RecipeService from '../services/RecipeService';
import { RECIPE_MESSAGES } from '../constants/speechText';
<<<<<<< HEAD
import ingredientDatabase from '../data/ingredientDatabase';
=======
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5

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
    SpeechService.announceWeight(
      ingredient.name,
      ingredient.amount,
      ingredient.unit
    );
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

      
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={() => {
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            selectIngredient(0);
            SpeechService.speak(RECIPE_MESSAGES.START_BAKING);
          }
        }}
      >
<<<<<<< HEAD
        <Text style={styles.startButtonText}>Start</Text>
=======
        <Text style={styles.startButtonText}>Start Baking</Text>
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Ingredients</Text>
      <View style={styles.ingredientsContainer}>
<<<<<<< HEAD
        {recipe.ingredients?.map((ingredient, index) => {
          const ingredientInfo = ingredientDatabase[ingredient.name];

          return (
            <TouchableOpacity
              key={index}
              style={styles.ingredientItem}
              onPress={() => selectIngredient(index)}
            >
              <View style={styles.ingredientItem}>
              {ingredientInfo?.imageUri ? (
                <Image
                  source={{ uri: ingredientInfo.imageUri }}
                  style={styles.ingredientImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: 'grey' }}>No image</Text> // optional fallback
              )}
                <Text style={styles.ingredientText}>
                  {ingredient.name.replace(/([a-z])([A-Z])/g, '$1 $2')}
                </Text>
                <Text style={styles.ingredientText}>
                  {ingredient.amount} {ingredient.unit}
                </Text>
              </View>

        <IconButton
          icon="volume-high"
          size={50}
          onPress={() => announceIngredient(ingredient)}
        />
      </TouchableOpacity>
    );
  })}
</View>

=======
        {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.ingredientItem}
            onPress={() => selectIngredient(index)} // Pass index instead of ingredient
          >
            <Text style={styles.ingredientText}>
              {ingredient.name}: {ingredient.amount} {ingredient.unit}
            </Text>
            <IconButton
              icon="volume-high"
              size={20}
              onPress={() => announceIngredient(ingredient)}
            />
          </TouchableOpacity>
        ))}
      </View>
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5



      <Text style={styles.sectionTitle}>Instructions</Text>
      <View style={styles.instructionsContainer}>
        {recipe.instructions && recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>{index + 1}</Text>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </View>
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
<<<<<<< HEAD
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  ingredientItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    margin: 20,
  },
  ingredientText: {
    fontSize: 32,
    fontWeight: 'bold',
    flex: 1,
  },
  ingredientImage: {
    width: 180,
    height: 180,
    margin: 22,
  },
=======
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
  ingredientText: {
    fontSize: 16,
    flex: 1,
  },
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
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
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
