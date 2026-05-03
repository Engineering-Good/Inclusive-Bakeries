import React, { useEffect, useLayoutEffect, useCallback, useState } from "react";
import { Animated } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import IngredientColumns from '../components/IngredientColumns';
import ConfirmationDialog from '../components/ConfirmationDialog';
import useIngredientWeighing from '../hooks/useIngredientWeighing';
import useAppState from '../hooks/useAppState';
import useUIState from '../hooks/useUIState';
import useRecipeProgress from '../hooks/useRecipeProgress';
import usePulseAnimation from '../hooks/usePulseAnimation';
import ingredientDatabase from "../data/ingredientDatabase";
import { INGREDIENT_MESSAGES } from "../constants/speechText";
import styles from './IngredientScreen.styles';

const IngredientScreen = ({ route, navigation }) => {
  const { ingredientIndex, recipe } = route.params;

  const {
    isFinalStep,
    ingredient,
    proceedToNextStep,
  } = useRecipeProgress({ ingredientIndex, recipe, navigation, route });

  const {
    currentWeight,
    weightReached,
    isMockScaleActive,
    isConnected,
    speak,
    replay,
    getBackgroundColor
  } = useIngredientWeighing(ingredient, ingredientIndex);
  
  useAppState();

  const { 
    showConfirmationDialog, 
    setShowConfirmationDialog,
    isProcessingNext,
    setIsProcessingNext,
    resetProcessingNextAfterDelay
  } = useUIState();

  const { scaleAnim, startPulse, stopPulse } = usePulseAnimation(weightReached);
  
  const [tareStatus, setTareStatus] = useState(false);

  const getIngredientImageSource = (imageUri) => {
    if (!imageUri) {
      return require('../assets/ingredients/ingredients_placeholder.png');
    }
    
    if (typeof imageUri === 'string') {
      return { uri: imageUri };
    }
    
    return imageUri;
  };

  useEffect(() => {
    return () => {
      stopPulse();
    };
  }, []);

  useEffect(() => {
    if (weightReached) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [weightReached]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <></>,
      headerTitleAlign: "center",
      headerRight: () => <></>,
    });
  }, [navigation]);

  ingredientDatabase[ingredient.name];

  const handleNext = useCallback(() => {
    if (isProcessingNext) return;
    setIsProcessingNext(true);

    try {
      const requireScale = ingredient.stepType === 'weight' || ingredient.stepType === 'weighable';
      if (!requireScale || !isConnected) {
        setShowConfirmationDialog(true);
        speak(`${INGREDIENT_MESSAGES.CONFIRM_ADDED} ${ingredient.name}?`);
      } else {
        proceedToNextStep();
      }
    } finally {
      resetProcessingNextAfterDelay(500);
    }
  }, [isConnected, ingredient, isProcessingNext, setIsProcessingNext, resetProcessingNextAfterDelay, speak, proceedToNextStep, setShowConfirmationDialog]);

  const handleTare = () => {
    console.log("Tare event received in IngredientScreen");
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
                {isFinalStep ? 'FINISH' : 'NEXT'}
              </Text>
              <Icon
                name={isFinalStep ? "check-circle" : "arrow-forward"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View
          style={[
            styles.middleSection,
            {
              backgroundColor: isConnected && (ingredient.stepType === 'weight' || ingredient.stepType === 'weighable')
                ? getBackgroundColor()
                : "#4CAF50",
            },
          ]}
        >
          {tareStatus ? (
            <Image
              source={require('../assets/Tare.png')}
              style={styles.ingredientImage}
            />
          ) : (
            <Image
              source={getIngredientImageSource(ingredient.imageUri)}
              style={styles.ingredientImage}
              onError={(e) => console.log("[IngredientScreen] Error loading ingredient image:", e.nativeEvent.error)}
            />
          )}
          <IngredientColumns
            ingredient={ingredient}
            currentWeight={currentWeight}
            onWeightChange={() => {}}
            onTare={handleTare}
            requireScale={(ingredient.stepType === 'weight' || ingredient.stepType === 'weighable')}
            styles={styles}
            isMockScaleActive={isMockScaleActive}
            onTareStatusChange={setTareStatus}
            tareStatus={tareStatus}
          />
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.addMoreText}>'.'</Text>
          
          <TouchableOpacity
            onPress={replay}
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

        <ConfirmationDialog
          visible={showConfirmationDialog}
          ingredientName={ingredient.name}
          onDismiss={() => setShowConfirmationDialog(false)}
          onConfirm={() => {
            setShowConfirmationDialog(false);
            proceedToNextStep();
          }}
        />
    </View>
  );
};

export default IngredientScreen;