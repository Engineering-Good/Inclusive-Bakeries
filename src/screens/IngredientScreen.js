import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { Divider, TouchableRipple, Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScaleReadingComponent from '../components/ScaleReadingComponent';
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import SpeechService from '../services/SpeechService';
import { INGREDIENT_MESSAGES } from '../constants/speechText';
import ingredientDatabase from '../data/ingredientDatabase';

const IngredientColumns = ({ ingredient, progress, handleProgressUpdate, requireScale, styles }) => (
  <>
    {/* Middle Column */}
    <View style={styles.column}>
      {requireScale ? (
        <>
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
        </>
      ) : (
        <>
          <Text style={styles.addMoreText}>
            {`${ingredient.amount} ${ingredient.unit} ${ingredient.name}`}
          </Text>
          <Text style={styles.addMoreText}>
            Ready for next step!
          </Text>
        </>
      )}
    </View>

    {/* Right Column (blank for now) */}
    <View style={styles.column}>
    </View>
  </>
);

const IngredientScreen = ({ route, navigation }) => {
  const { ingredientIndex, recipe } = route.params;
  const ingredient = recipe.ingredients[ingredientIndex];
  const [progress, setProgress] = useState(0);
  const [weightReached, setWeightReached] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const hasSpokenRef = useRef(false);
  const isLastIngredient = ingredientIndex === recipe.ingredients.length - 1;

  // Determine if the ingredient requires scale interaction
  const requireScale = ingredient.unit === 'g';

  console.log('[IngredientScreen] Ingredient:', ingredient);

  useEffect(() => {
    // Reset states when component mounts or ingredient changes
    setProgress(0);
    setWeightReached(false);
    hasSpokenRef.current = false; // Reset the spoken ref

    // Announce the new ingredient
    announceIngredient();

    // If no scale is required, set weightReached to true immediately
    if (!requireScale) {
      setWeightReached(true);
    }

    // Only cleanup on unmount
    return () => {
      setProgress(0);
      setWeightReached(false);
      SpeechService.stop();
    }
  }, [ingredient, requireScale]);

  const announceIngredient = useCallback(() => {
    SpeechService.announceIngredient(
      ingredient.name,
      ingredient.amount,
      ingredient.unit
    );
  }, [ingredient]);

  const proceedToNextStep = () => {
    if (isLastIngredient) {
      SpeechService.stop();
      ScaleServiceFactory.unsubscribeAll();
      navigation.replace('Celebration');
    } else {
      navigation.replace('Ingredient', {
        ingredientIndex: ingredientIndex + 1,
        recipe,
      });
    }
  };

  const handleNext = () => {
    console.log('[IngredientScreen] Next button pressed');

    if (!requireScale) {
      setShowConfirmationDialog(true);
      SpeechService.speak(`${INGREDIENT_MESSAGES.CONFIRM_ADDED} ${ingredient.name}?`);
    } else {
      proceedToNextStep();
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
    if (!requireScale) {
      // If no scale is required, this function should not be called or should do nothing
      return;
    }

    console.log('[IngredientScreen] Ingredient Progress update:', ingredient, currentProgress);
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
<></>
      ),
      headerTitleAlign: 'center',
      headerRight: () => (
          <></>

      ),
    });
  }, [navigation, ingredient, weightReached, isLastIngredient]);

  const fullIngredient = ingredientDatabase[ingredient.name];

  return (
    <View style={[styles.container]}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {ingredient.name}<br></br>{`${ingredient.amount} ${ingredient.unit}`}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            right: '2.5%',
            top: '8%',
            transform: [{ translateY: -25 }],
            zIndex: 10,
          }}
        >
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
        </View>

      {/* Middle Section */}
      <View style={[
        styles.middleSection,
        { backgroundColor: requireScale ? getBackgroundColor(progress) : '#4CAF50' }
      ]}>
        {fullIngredient && fullIngredient.imageUri ? (
            <Image
              source={{ uri: fullIngredient.imageUri }}
              style={styles.ingredientImage}
            />
          ) : (
            <Text style={{ color: 'black' }}>No image found</Text>
          )}
        <IngredientColumns
          ingredient={ingredient}
          progress={progress}
          handleProgressUpdate={handleProgressUpdate}
          requireScale={requireScale}
          styles={styles}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.addMoreText}>
          '.'
        </Text>
      </View>

      <Portal>
        <Dialog visible={showConfirmationDialog} onDismiss={() => setShowConfirmationDialog(false)} style={styles.confirmationDialog}>
          <Dialog.Title>Confirm {`${ingredient.name}`}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Have you completed this step?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              buttonColor="red"
              onPress={() => {
                setShowConfirmationDialog(false);
                announceIngredient();
              }}
              style={styles.dialogButton}
            >
              No
            </Button>
            <Button
              mode="contained"
              buttonColor="green"
              onPress={() => {
                setShowConfirmationDialog(false);
                proceedToNextStep();
              }}
              style={styles.dialogButton}
            >
              Yes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', // Assuming a white background for the overall page
    justifyContent: 'center',
  },
  topSection: {
    backgroundColor: 'white',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    //flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white', // Changed to white for better visibility on colored backgrounds
    textAlign: 'center',
    marginBottom: 10, // Add some space below the subtitle
  },
  nextButton: {
    alignSelf: 'flex-end',
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
    flexDirection: 'column', // Arrange children in a row
    justifyContent: 'center', // Distribute space evenly
    alignItems: 'center', // Center items vertically
    paddingHorizontal: 10, // Add some horizontal padding
  },
  column: {
    flex: 1, // Each column takes equal space
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  ingredientImage: {
    width: 300,
    height: 300,
    margin: 12,
    marginTop: 20,
  },
  targetWeightText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    alignSelf: 'center',
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
  },
  confirmationDialog: {
    maxWidth: 350, // Adjust as needed
    alignSelf: 'center',
  },
  dialogButton: {
    flex: 1,
    marginHorizontal: 5, // Add some space between buttons
    paddingVertical: 5, // Adjust padding to match Next button's height
    paddingHorizontal: 10, // Adjust padding to match Next button's width
  },
    imageContainer: {
    width: '100%',
    height: 150, // Same height as recipeImage
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure image doesn't overflow rounded corners
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  }
});

export default IngredientScreen;
