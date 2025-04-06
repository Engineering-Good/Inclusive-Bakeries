import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Divider } from 'react-native-paper';
import ScaleReadingComponent from '../components/ScaleReadingComponent'; // Assuming this is the correct path
import SpeechService from '../services/SpeechService';

const IngredientScreen = ({ route, navigation }) => {
  const { ingredientIndex, recipe } = route.params;
  const ingredient = recipe.ingredients[ingredientIndex];
  const [progress, setProgress] = useState(0);
  const [weightReached, setWeightReached] = useState(false);
  const [isTared, setIsTared] = useState(false);
  const isLastIngredient = ingredientIndex === recipe.ingredients.length - 1;
  console.log('[IngredientScreen] Ingredient:', ingredient);

  useEffect(() => {
    announceIngredient();
    // Reset tare state when component mounts (new ingredient)
    setIsTared(false);
  }, []);

  const announceIngredient = () => {
    SpeechService.announceWeight(
      ingredient.name,
      ingredient.amount,
      ingredient.unit
    );
  };

  const handleNext = () => {
    if (isLastIngredient) {
      navigation.navigate('CelebrationScreen');
    } else {
      navigation.navigate('IngredientScreen', {
        ingredientIndex: ingredientIndex + 1,
        recipe,
      });
    }
  };

  const getBackgroundColor = (progress) => {
    if (progress >= 1) return '#4CAF50'; // Green
    if (progress >= 0.8) return '#FFEB3B'; // Yellow
    if (progress >= 0.01) return '#F44336'; // Red
  };


  const handleProgressUpdate = (currentProgress) => {
    console.log('[IngredientScreen] Progress update:', currentProgress);
    // Only update progress if scale has been tared
      setProgress(currentProgress);
      setWeightReached(currentProgress >= 0.99);

  };

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.title}>{`${ingredient.amount}${ingredient.unit} ${ingredient.name}`}</Text>
      </View>

      {/* Middle Section */}
      <View style={[
        styles.middleSection, 
        { backgroundColor: getBackgroundColor(progress) }
      ]}>
        <ScaleReadingComponent 
          targetIngredient={ingredient}
          onProgressUpdate={handleProgressUpdate}
          requireTare={!isTared}
        />
        
        <Divider style={{ height: 1, backgroundColor: 'black' }} />
        <Text style={styles.addMoreText}>
          {weightReached ? 'Perfect!' : 'Add more'}
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.nextButton, !weightReached && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!weightReached}
        >
          <Text style={styles.nextButtonText}>
            {isLastIngredient ? 'FINISH' : 'NEXT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', // Assuming a white background for the overall page
  },
  topSection: {
    backgroundColor: 'white', // Or any color you prefer for the top bar
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // You might want to add elevation or shadow for a distinct header
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  middleSection: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quantityText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  bottomSection: {
    backgroundColor: 'white', // Or any color for the bottom section
    padding: 20,
    alignItems: 'flex-end',
  },
  nextButton: {
    backgroundColor: 'lightgreen', // Approximate color from the screenshot
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5, // Optional: for rounded corners
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5, // Space for the arrow if you implement it as text
  },
});

export default IngredientScreen;