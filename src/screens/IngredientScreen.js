import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { Divider, TouchableRipple, Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScaleReadingComponent from '../components/ScaleReadingComponent';
import MockScaleComponent from '../components/MockScaleComponent'; // Import MockScaleComponent
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import SpeechService from '../services/SpeechService';
import { INGREDIENT_MESSAGES, RECIPE_MESSAGES } from '../constants/speechText';
import { SCALE_MESSAGES } from '../constants/speechText';
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

    {/* Right Column */}
    <View style={styles.column}>
      {requireScale && <MockScaleComponent />}
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
    hasSpokenRef.current = null; // Reset the spoken ref

    const announceIngredientOrder = async () => {
      // First ingredient needs the "Let's start baking!" announcement
      if (ingredientIndex === 0) {
        await SpeechService.speak(RECIPE_MESSAGES.START_BAKING);
        await SpeechService.waitUntilDone();
        await SpeechService.delay(SpeechService.SPEECH_DELAY);
      }

      // // Announce tare if needed
      if (ingredient.requireTare) {
        await SpeechService.speak(SCALE_MESSAGES.TARE_NEEDED);
        await SpeechService.waitUntilDone();
        await SpeechService.delay(SpeechService.SPEECH_DELAY);
      }

      // Announce which ingredient number we're on
      let orderMessage;
      if (ingredientIndex === 0) {
        orderMessage = RECIPE_MESSAGES.FIRST_INGREDIENT;
      } else if (ingredientIndex === 1) {
        orderMessage = RECIPE_MESSAGES.SECOND_INGREDIENT;
      } else if (ingredientIndex === 2) {
        orderMessage = RECIPE_MESSAGES.THIRD_INGREDIENT;
      } else {
        orderMessage = RECIPE_MESSAGES.NEXT_INGREDIENT;
      }

      await SpeechService.speak(orderMessage);
      await SpeechService.waitUntilDone();
      await SpeechService.delay(SpeechService.SPEECH_DELAY);

      // Now announce the ingredient details and instructions
      const goalAnnouncement = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
      await SpeechService.speak(goalAnnouncement);
      await SpeechService.waitUntilDone();
      await SpeechService.delay(SpeechService.SPEECH_DELAY);

      // Announce the custom instruction if available
      if (ingredient.instructionText && ingredient.instructionText.trim()) {
        await SpeechService.speak(ingredient.instructionText);
        await SpeechService.waitUntilDone();
      }
    };

    announceIngredientOrder();

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
  }, [ingredient, requireScale, ingredientIndex]);

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
      // For non-weight items, enable Next as soon as any change in mass is detected
      if (currentProgress > 0.01) {
        setWeightReached(true);
      } else {
        setWeightReached(false);
      }
      return;
    }
    if (!isStable) {
      // If scale is not stable, do nothing for weight items
      return;
    }

    console.log('[IngredientScreen] Ingredient Progress update:', ingredient, currentProgress);
    // Only update progress if scale has been tared
    setProgress(currentProgress);

    // Perfect weight range
    if (currentProgress >= 0.95 && currentProgress <= 1.05) {
      if (!hasSpokenRef.current || hasSpokenRef.current !== 'perfect') {
        setWeightReached(true);
        hasSpokenRef.current = 'perfect';
        SpeechService.speak(INGREDIENT_MESSAGES.PERFECT_WEIGHT);
      }
    }
    // Underweight range
    else if (currentProgress < 0.95 && currentProgress >= 0.05) {
      if (!hasSpokenRef.current || hasSpokenRef.current !== 'under') {
        setWeightReached(false);
        hasSpokenRef.current = 'under';
        SpeechService.speak(`${INGREDIENT_MESSAGES.ADD_MORE} ${ingredient.name}`);
      }
    }
    // Overweight range
    else if (currentProgress > 1.05) {
      if (!hasSpokenRef.current || hasSpokenRef.current !== 'over') {
        setWeightReached(false);
        hasSpokenRef.current = 'over';
        SpeechService.speak(INGREDIENT_MESSAGES.TOO_MUCH);
      }
    }
    // Starting/empty scale
    else if (currentProgress < 0.01) {
      if (!hasSpokenRef.current || hasSpokenRef.current !== 'start') {
        setWeightReached(false);
        hasSpokenRef.current = 'start';
        SpeechService.speak(INGREDIENT_MESSAGES.START_WEIGHING);
      }
    }

    // Reset hasSpokenRef when weight changes significantly
    if ((hasSpokenRef.current === 'start' && currentProgress >= 0.05) ||
        (hasSpokenRef.current === 'under' && currentProgress >= 0.95) ||
        (hasSpokenRef.current === 'perfect' && (currentProgress < 0.95 || currentProgress > 1.05)) ||
        (hasSpokenRef.current === 'over' && currentProgress <= 1.05)) {
      hasSpokenRef.current = null;
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
            {ingredient.name + '\n'}
            {`${ingredient.amount} ${ingredient.unit}`}
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
        {fullIngredient && fullIngredient.imageUri && (
            <Image
              source={{ uri: fullIngredient.imageUri }}
              style={styles.ingredientImage}
            />
          )
        }
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
