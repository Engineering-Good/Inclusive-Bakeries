import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions
} from "react-native";
import {
  Divider,
  TouchableRipple,
  Dialog,
  Portal,
  Button,
  Paragraph,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScaleReadingComponent from "../components/ScaleReadingComponent";
import MockScaleComponent from '../components/MockScaleComponent'; 
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import SpeechService from "../services/SpeechService";
import { INGREDIENT_MESSAGES, RECIPE_MESSAGES } from "../constants/speechText";
import { SCALE_MESSAGES } from "../constants/speechText";
import ingredientDatabase from "../data/ingredientDatabase";
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from "@react-navigation/native";

const IngredientColumns = ({ ingredient, progress, handleProgressUpdate, requireScale, styles, isMockScaleActive }) => {
  const isWeighable = ingredient.stepType === 'weighable';
  const isInstruction = ingredient.stepType === 'instruction';
  const isWeightBased = ingredient.stepType === 'weight';

  return (
    <View style={styles.columnsContainer}>
      {/* Middle Column */}
      <View style={styles.column}>
        {isWeightBased && (
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
        )}
        {(isWeighable || isInstruction) && (
          <>
            {isWeighable && (
              <ScaleReadingComponent
                targetIngredient={ingredient}
                onProgressUpdate={handleProgressUpdate}
                requireTare={false}
                isWeighableOnly={true}
              />
            )}
            <Text style={styles.addMoreText}>
              Ready for next step!
            </Text>
          </>
        )}
      </View>
       {/* Right Column */}
    {requireScale && isMockScaleActive && (
    <View style={styles.column}>
       <MockScaleComponent />
    </View>
    )}
  </View>
);
}


   

const IngredientScreen = ({ route, navigation }) => {
  const { ingredientIndex, recipe } = route.params;
  const ingredient = recipe.ingredients[ingredientIndex];
  const [progress, setProgress] = useState(0);
  const [weightReached, setWeightReached] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [nextButtonEnabled, setnextButtonEnabled] = useState(false);
  const [isMockScaleActive, setIsMockScaleActive] = useState(false);
  const hasSpokenRef = useRef('');
  const addMoreIntervalRef = useRef(null);
  const isLastIngredient = ingredientIndex === recipe.ingredients.length - 1;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);

  // Determine if the ingredient requires scale interaction
  const requireScale = ingredient.unit === "g";

  console.log("[IngredientScreen] Ingredient:", ingredient);
  const instructionRef = useRef("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function activateService() {
        const scaleService = await ScaleServiceFactory.getScaleService();
        if (active && scaleService.setActive) {
          scaleService.setActive(requireScale);
        }
      }

      activateService();

      const interval = setInterval(() => {
        ScaleServiceFactory.checkConnection();
      }, 31000);

      return () => {
        active = false;
        console.log("Cleaning up scale connection check...");
        ScaleServiceFactory.getScaleService().then((service) => {
          if (service.setActive) {
            service.setActive(false);
          }
        });
        clearInterval(interval);
      };
    }, [requireScale])
  );

  useEffect(() => {
    const checkMockScaleStatus = async () => {
      const mockActive = await ScaleServiceFactory.isMockScaleSelected();
      setIsMockScaleActive(mockActive);
    };

    checkMockScaleStatus();

    // Clear any existing interval when the effect re-runs (e.g., for a new ingredient)
    if (addMoreIntervalRef.current) {
      clearInterval(addMoreIntervalRef.current);
      addMoreIntervalRef.current = null;
    }

    // Reset states when component mounts or ingredient changes
    setProgress(0);
    setWeightReached(false);
    hasSpokenRef.current = null; // Reset the spoken ref

    const announceIngredientOrder = async () => {
      // First ingredient needs the "Let's start baking!" announcement
      if (ingredientIndex === 0) {
        await SpeechService.speak(RECIPE_MESSAGES.START_BAKING);
      }

      // Announce tare if needed for weight-based ingredients
      if (ingredient.stepType === 'weight' && ingredient.requireTare) {
        await SpeechService.speak(SCALE_MESSAGES.TARE_NEEDED);
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

      // For weight-based and weighable ingredients, announce the quantity
      if (ingredient.stepType !== 'instruction') {
        const goalAnnouncement = `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`;
        await SpeechService.speak(goalAnnouncement);
        await SpeechService.waitUntilDone();
        await SpeechService.delay(SpeechService.SPEECH_DELAY);
      }

      // Announce the instruction text
      let instructionLine = ingredient.instructionText?.trim();
      if (!instructionLine || instructionLine === '') {
        if (ingredient.stepType === 'weight') {
          instructionLine = `${INGREDIENT_MESSAGES.INGREDIENT_INSTRUCTION} ${ingredient.name}`;
        } else if (ingredient.stepType === 'weighable') {
          instructionLine = `Place ${ingredient.name} on the scale`;
        }
      }

      // Append appropriate final instruction
      instructionLine += isLastIngredient
        ? '. Press finish to complete.'
        : '. Press next when ready.';

      // Save it so we can replay later
      instructionRef.current = instructionLine;

      // Speak it
      await SpeechService.speak(instructionLine);
      await SpeechService.waitUntilDone();
    };

    announceIngredientOrder();

    // If it's an instruction step, set weightReached to true immediately
    if (ingredient.stepType === 'instruction') {
      setWeightReached(true);
    }

    // Cleanup function for unmount
    return () => {
      setProgress(0);
      setWeightReached(false);
      SpeechService.stop();
      ScaleServiceFactory.unsubscribeAll();
    };
  }, [ingredient, ingredientIndex]);

  useEffect(() => {
    if (weightReached) {
      startPulse();
    } else {
      stopPulse();
    }
    return stopPulse;
  }, [weightReached]);
  

  const proceedToNextStep = () => {
    if (isLastIngredient) {
      SpeechService.stop();
      ScaleServiceFactory.unsubscribeAll();
      navigation.replace("Celebration");
    } else {
      navigation.replace("Ingredient", {
        ingredientIndex: ingredientIndex + 1,
        recipe,
      });
    }
  };

  const handleNext = () => {
    console.log("[IngredientScreen] Next button pressed");

    if (!requireScale) {
      setShowConfirmationDialog(true);
      SpeechService.speak(
        `${INGREDIENT_MESSAGES.CONFIRM_ADDED} ${ingredient.name}?`
      );
    } else {
      proceedToNextStep();
    }
  };

  const handleProgressUpdate = (currentProgress, isStable) => {
    const isWeighable = ingredient.stepType === 'weighable';
    const isInstruction = ingredient.stepType === 'instruction';
    const isWeightBased = ingredient.stepType === 'weight';

    if (isInstruction) {
      // For instructions, enable Next button immediately
      setWeightReached(true);
      return;
    }

    if (isWeighable) {
      // For non-weight weighable items, enable Next as soon as any change in mass is detected
      if (currentProgress > 0.01) {
        setWeightReached(true);
      }
      return;
    }

    if (!isStable) {
      // If scale is not stable, do nothing for weight items
      return;
    }

    console.log(
      "[IngredientScreen] Ingredient Progress update:",
      ingredient,
      currentProgress
    );
    // Only update progress if scale has been tared
    setProgress(currentProgress);

    // Get target weight and tolerance in grams
    const targetWeight = parseFloat(ingredient.amount);
    const toleranceGrams = parseFloat(ingredient.tolerance || '0');
    const currentWeight = currentProgress * targetWeight;
    
    // Calculate acceptable range
    const minWeight = targetWeight - toleranceGrams;
    const maxWeight = targetWeight + toleranceGrams;

    console.log('[IngredientScreen] Weight validation:', {
      currentWeight,
      targetWeight,
      toleranceGrams,
      minWeight,
      maxWeight
    });

    // Update weightReached based on whether we're within tolerance
    setWeightReached(currentWeight >= minWeight && currentWeight <= maxWeight);
  };

  const getBackgroundColor = (progress) => {
    if (!requireScale) return '#4CAF50'; // Green for non-weight items
    
    const targetWeight = parseFloat(ingredient.amount);
    const toleranceGrams = parseFloat(ingredient.tolerance || '0');
    const currentWeight = progress * targetWeight;
    
    // Calculate acceptable range
    const minWeight = targetWeight - toleranceGrams;
    const maxWeight = targetWeight + toleranceGrams;

    if (currentWeight > maxWeight) return '#0900FF'; // Blue for over
    if (currentWeight >= minWeight) return '#4CAF50'; // Green for perfect
    if (currentWeight >= 0.01 * targetWeight) return '#F44336'; // Red for under
    return '#F44336'; // Red for empty scale
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <></>,
      headerTitleAlign: "center",
      headerRight: () => <></>,
    });
  }, [navigation, ingredient, weightReached, isLastIngredient]);

  const fullIngredient = ingredientDatabase[ingredient.name];

  const startPulse = () => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    animationRef.current.start();
  };
  
  const stopPulse = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    scaleAnim.setValue(1); // Reset scale
  };
  

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
            top: '5.5%',
            transform: [{ translateY: -25 }],
            zIndex: 10,
          }}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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
          </Animated.View>

          {/* <TouchableOpacity
            style={[
              styles.nextButton,
              (!weightReached && !nextButtonEnabled) && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!weightReached && !nextButtonEnabled}
          >
            <Text style={styles.nextButtonText}>
              {isLastIngredient ? 'FINISH' : 'NEXT'}
            </Text>
            <Icon
              name={isLastIngredient ? "check-circle" : "arrow-forward"}
              size={24}
              color="white"
            />
          </TouchableOpacity> */}
        </View>

      {/* Middle Section */}
      <View
        style={[
          styles.middleSection,
          {
            backgroundColor: requireScale
              ? getBackgroundColor(progress)
              : "#4CAF50",
          },
        ]}
      >
        {fullIngredient && fullIngredient.imageUri && (
          <Image
            source={{ uri: fullIngredient.imageUri }}
            style={styles.ingredientImage}
          />
        )}
        <IngredientColumns
          ingredient={ingredient}
          progress={progress}
          handleProgressUpdate={handleProgressUpdate}
          requireScale={requireScale}
          styles={styles}
          isMockScaleActive={isMockScaleActive}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.addMoreText}>'.'</Text>

        <TouchableOpacity
          onPress={() => SpeechService.speak(instructionRef.current)}
          style={{
            backgroundColor: "#FFFFFFAA",
            borderRadius: 50,
            padding: 10,
            alignItems: "center",
          }}
        >
          <Icon name="volume-up" size={64} color="black" />
        </TouchableOpacity>
      </View>

      <Portal>
        <Dialog
          visible={showConfirmationDialog}
          onDismiss={() => setShowConfirmationDialog(false)}
          style={styles.confirmationDialog}
        >
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

const screenHeight = Dimensions.get('window').height;
const ingredientImageMaxHeight = screenHeight * 0.20; // 20% of screen height

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white", // Assuming a white background for the overall page
    justifyContent: "center",
  },
  topSection: {
    backgroundColor: "white",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignContent: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    //flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "white", // Changed to white for better visibility on colored backgrounds
    textAlign: "center",
    marginBottom: 10, // Add some space below the subtitle
  },
  nextButton: {
    alignSelf: "flex-end",
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
  nextButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  nextButtonText: {
    color: "white",
    fontSize: 50,
    fontWeight: "bold",
    marginRight: 8, // Space between text and icon
  },
  middleSection: {
    flex: 1,
    backgroundColor: "#F44336",
    flexDirection: "column", // Arrange children in a row
    justifyContent: "center", // Distribute space evenly
    alignItems: "center", // Center items vertically
    paddingHorizontal: 10, // Add some horizontal padding
  },
  column: {
    flex: 1, // Each column takes equal space
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  ingredientImage: {
    width: 300,
    height: 300,
    margin: 12,
    marginTop: 20,
    maxHeight: ingredientImageMaxHeight,
    resizeMode: 'contain', // Ensure the image scales down to fit within the maxHeight
  },
  targetWeightText: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
    alignSelf: "center",
  },
  addMoreText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  quantityText: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
  },
  bottomSection: {
    backgroundColor: "white", // Or any color for the bottom section
    padding: 0,
    alignItems: "flex-end",
  },
  confirmationDialog: {
    maxWidth: 350, // Adjust as needed
    alignSelf: "center",
  },
  dialogButton: {
    flex: 1,
    marginHorizontal: 5, // Add some space between buttons
    paddingVertical: 5, // Adjust padding to match Next button's height
    paddingHorizontal: 10, // Adjust padding to match Next button's width
  },
  imageContainer: {
    width: "100%",
    height: 150, // Same height as recipeImage
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Ensure image doesn't overflow rounded corners
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  }
});

export default IngredientScreen;
