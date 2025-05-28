import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Divider, TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScaleReadingComponent from '../components/ScaleReadingComponent';
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import SpeechService from '../services/SpeechService';
import { INGREDIENT_MESSAGES } from '../constants/speechText';

const IngredientScreen = ({ route, navigation }) => {
  const { ingredientIndex, recipe } = route.params;
  const ingredient = recipe.ingredients[ingredientIndex];
  const [progress, setProgress] = useState(0);
  const [weightReached, setWeightReached] = useState(false);
  const hasSpokenRef = useRef(false);
    
  const isLastIngredient = ingredientIndex === recipe.ingredients.length - 1;
  
  console.log('[IngredientScreen] Ingredient:', ingredient);

  useEffect(() => {
    // Reset states when component mounts or ingredient changes
    setProgress(0);
    setWeightReached(false);
    hasSpokenRef.current = false; // Reset the spoken ref
    
    // Announce the new ingredient
    announceIngredient();
  
   // Only cleanup on unmount
   return () => {

      setProgress(0);
      setWeightReached(false);
      SpeechService.stop();
    }
}, [ingredient]);

  const announceIngredient = useCallback(() => {
    SpeechService.announceWeight(
      ingredient.name,
      ingredient.amount,
      ingredient.unit
    );
  }, [ingredient]);

  const handleNext = () => {
    console.log('[IngredientScreen] Next button pressed');
    if (isLastIngredient) {
      SpeechService.stop();
      ScaleServiceFactory.unsubscribeAll();
      navigation.replace('Celebration');
    } else {
      navigation.navigate('Ingredient', {
        ingredientIndex: ingredientIndex + 1,
        recipe,
      });
    }
  };

  const getBackgroundColor = (progress) => {
    if (progress >= 1.05) return '#0900FF'; // Blue
    if (progress >= 0.95) return '#4CAF50'; // Green
    if (progress >= 0.8) return '#FF9800'; // Yellow
    if (progress >= 0.01) return '#F44336'; // Red
    return '#F44336'; // Red for empty scale
  };


  const handleProgressUpdate = (currentProgress, isStable) => {
    console.log('[IngredientScreen] Ingregient Progress update:', ingredient, currentProgress);
    // Only update progress if scale has been tared
    setProgress(currentProgress);
    
    // Perfect weight range
    if (isStable && currentProgress >= 0.95 && currentProgress <= 1.05) {
      if (!hasSpokenRef.current || hasSpokenRef.current !== 'perfect') {
        setWeightReached(true);
        SpeechService.speak(INGREDIENT_MESSAGES.PERFECT_WEIGHT);
        hasSpokenRef.current = 'perfect';
      }
    }
    // Underweight range
    else if (isStable && currentProgress < 0.95 && currentProgress >= 0.05) {
      if (!hasSpokenRef.current || hasSpokenRef.current !== 'under') {
        setWeightReached(false);
        SpeechService.speak(INGREDIENT_MESSAGES.ADD_MORE);
        hasSpokenRef.current = 'under';
      }
    }
    // Overweight range
    else if (currentProgress > 1.05) {
      if (isStable && !hasSpokenRef.current || hasSpokenRef.current !== 'over') {
        setWeightReached(false);
        SpeechService.speak(INGREDIENT_MESSAGES.TOO_MUCH);
        hasSpokenRef.current = 'over';
      }
    }
    // Starting/empty scale
    else if (isStable && currentProgress < 0.01) {
      if (!hasSpokenRef.current || hasSpokenRef.current !== 'start') {
        setWeightReached(false);
        SpeechService.speak(INGREDIENT_MESSAGES.START_WEIGHING);
        hasSpokenRef.current = 'start';
      }
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {`${ingredient.amount}${ingredient.unit} ${ingredient.name}`}
          </Text>
        </View>
      ),
      headerTitleAlign: 'center', // This centers the entire header title component
      headerRight: () => (
        <Text>Next Button tmp</Text>
      ),
    });
  }, [navigation, ingredient, weightReached, isLastIngredient]);



  return (
    <View style={styles.container}>
      
      <TouchableOpacity 
          style={[
            styles.nextButton, 
            !weightReached && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!weightReached}
        >
          <Text style={styles.nextButtonText}>
            {isLastIngredient ? 'FINISH' : 'NEXT'}
          </Text>
          <Icon 
            name={isLastIngredient ? "check-circle" : "arrow-forward"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>

      {/* Middle Section */}
      <View style={[
        styles.middleSection, 
        { backgroundColor: getBackgroundColor(progress) }
      ]}>
        <ScaleReadingComponent 
          targetIngredient={ingredient}
          onProgressUpdate={handleProgressUpdate}
          requireTare={ingredient.requireTare}
        />
        
        <Divider style={{ height: 1, backgroundColor: 'black' }} />

          <Text style={styles.addMoreText}>
            {
            progress >= 1.05 ? 'Take some out' :
            progress >= 0.95 ? 'Perfect!' :
            progress >= 0.05 ? 'Add more' : ''
            }  
          </Text>
          <Divider style={{ height: 1, backgroundColor: 'black' }} />

      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
      < Text style={styles.addMoreText}>
          '.'
        </Text>
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
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999, // Ensure button is above other content
    elevation: 5, // Add elevation for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8, // Space between text and icon
  },
  middleSection: {
    flex: 1,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    verticalAlign: 'middle',
    
  },
  addMoreText: {
    color: 'white',
    fontSize: 28,
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
    padding: 0,
    alignItems: 'flex-end',
  }
});

export default IngredientScreen;
