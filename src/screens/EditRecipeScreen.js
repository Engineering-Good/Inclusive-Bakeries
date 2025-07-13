import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { IconButton, Button, Checkbox, Card, Snackbar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dialog, Portal } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import RecipeService from '../services/RecipeService';
import ingredientDatabase from '../data/ingredientDatabase';


export default function EditRecipeScreen({ route, navigation }) {
  const { recipe: initialRecipe, onSave } = route.params || {};
  const [title, setTitle] = useState(initialRecipe?.title || '');
  const [recipeImage, setRecipeImage] = useState(initialRecipe?.imageUri || null);
  const [ingredients, setIngredients] = useState(initialRecipe?.ingredients || []);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteIngredientDialog, setDeleteIngredientDialog] = useState({ visible: false, ingredient: null });
  const [unsavedChangesDialog, setUnsavedChangesDialog] = useState({ visible: false });
  const [unsavedIngredientDialog, setUnsavedIngredientDialog] = useState({ visible: false });
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalIngredient, setOriginalIngredient] = useState(null);
  const [isIngredientNavigating, setIsIngredientNavigating] = useState(false);

  // Handle back button/gesture navigation
  useEffect(() => {
    const handleBackPress = (e) => {
      // If we're in the process of saving or navigating, allow the navigation
      if (isSaving || isNavigating) {
        return;
      }

      // Check if there are unsaved changes
      const hasUnsavedChanges = 
        title !== (initialRecipe?.title || '') ||
        JSON.stringify(ingredients) !== JSON.stringify(initialRecipe?.ingredients || []) ||
        recipeImage !== initialRecipe?.imageUri;

      if (hasUnsavedChanges) {
        e.preventDefault();
        setUnsavedChangesDialog({ visible: true });
      }
    };

    const unsubscribe = navigation.addListener('beforeRemove', handleBackPress);
    return () => unsubscribe();
  }, [navigation, title, ingredients, recipeImage, initialRecipe, isNavigating, isSaving]);

  const handleDiscardChanges = () => {
    setIsNavigating(true);
    setUnsavedChangesDialog({ visible: false });
    navigation.goBack();
  };

  const handleSaveAndExit = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Recipe title is required');
        return;
      }

      // Set saving state to prevent navigation dialog
      setIsSaving(true);
      
      const instructions = ingredients
        .filter(ing => ing.instructionText && ing.instructionText.trim())
        .map(ing => ing.instructionText.trim());
      
      // Process the recipe image
      let finalImageUri = recipeImage;
      if (finalImageUri && typeof finalImageUri === 'object' && finalImageUri.uri) {
        finalImageUri = finalImageUri.uri;
      }
      
      const updatedRecipe = {
        id: initialRecipe?.id || Date.now().toString(),
        title: title.trim(),
        imageUri: finalImageUri || require('../assets/recipes/placeholder.png'),
        ingredients: ingredients.map(ing => ({
          ...ing,
          imageUri: ing.imageUri && typeof ing.imageUri === 'object' && ing.imageUri.uri 
            ? ing.imageUri.uri 
            : (ing.imageUri || require('../assets/recipes/placeholder.png'))
        })),
        instructions
      };

      console.log('[EditRecipeScreen] Saving recipe:', updatedRecipe);
      
      // Save the recipe using RecipeService
      const savedRecipe = await RecipeService.saveRecipe(updatedRecipe);
      console.log('[EditRecipeScreen] Recipe saved successfully:', savedRecipe);
      
      // Call onSave callback if provided
      if (onSave) {
        await onSave(savedRecipe);
      }
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('[EditRecipeScreen] Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
      setIsSaving(false);
    }
  };

  const handleSaveChangesFromDialog = async () => {
    setUnsavedChangesDialog({ visible: false });
    await handleSaveAndExit();
  };

  const getImageSource = (imageUri) => {
    if (!imageUri) {
      return require('../assets/recipes/placeholder.png');
    }
    
    if (typeof imageUri === 'string') {
      return { uri: imageUri };
    }
    
    return imageUri;
  };


  const showSnackbar = useCallback((message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const handleDeleteIngredient = useCallback(async (ingredientId) => {
    console.log('Attempting to delete ingredient:', ingredientId);
    
    if (ingredients.length <= 1) {
      Alert.alert('Error', 'Recipe must have at least one ingredient');
      return;
    }
  
    try {
      // Update the local state immediately
      const updatedIngredients = ingredients.filter(ing => ing.id !== ingredientId);
      setIngredients(updatedIngredients);
      
      // Update recipe if it exists
      if (initialRecipe?.id) {
        const updatedRecipe = {
          ...initialRecipe,
          ingredients: updatedIngredients
        };
        await RecipeService.saveRecipe(updatedRecipe);
      }
  
      showSnackbar('Ingredient deleted successfully');
      
      // Close editor if the deleted ingredient was being edited
      if (selectedIngredient?.id === ingredientId) {
        setSelectedIngredient(null);
      }
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      // Revert state if something fails
      setIngredients(ingredients);
      Alert.alert('Error', 'Failed to delete ingredient');
    }
  }, [ingredients, initialRecipe, selectedIngredient, showSnackbar]);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        console.log('Loading recipes from storage in EditRecipeScreen...');
        const storedRecipes = await AsyncStorage.getItem('recipes');
        if (storedRecipes) {
          const parsedRecipes = JSON.parse(storedRecipes);
          console.log('Loaded recipes:', parsedRecipes.length);
          setRecipes(parsedRecipes);
        }
      } catch (error) {
        console.error('Error loading recipes:', error);
      }
    };
    loadRecipes();
  }, []);

  useEffect(() => {
    if (!initialRecipe) {
      setIngredients([{
        id: Date.now().toString(),
        name: '',
        amount: '',
        unit: 'g', // Default to grams
        tolerance: '',
        imageUri: null,
        requireTare: false,
        instructionText: '',
        stepType: 'weight', // Default to weight-based step
        requiresCheck: false
      }]);
    }
  }, []);

  const playInstructionAudio = async (text) => {
    try {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play instruction audio');
    }
  };

  const pickImage = async (forRecipe = true, ingredientId = null) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      if (forRecipe) {
        setRecipeImage(result.assets[0].uri);
      } else {
        updateIngredient(ingredientId, 'imageUri', result.assets[0].uri);
      }
    }
  };

  const updateIngredient = useCallback((id, key, value) => {
    console.log('Updating ingredient:', { id, key, value });
    const processedValue = key === 'imageUri' && typeof value === 'object' && value.uri 
      ? value.uri 
      : value;
  
    setSelectedIngredient(prev => {
      if (!prev) return null;

      // If updating the name, check if it exists in the database and apply defaults
      const updated = {
        ...prev,
        [key]: processedValue
      };

      if (key === 'name' && value in ingredientDatabase) {
        const dbIngredient = ingredientDatabase[value];
        updated.stepType = dbIngredient.stepType;
        updated.unit = dbIngredient.unit;
        updated.imageUri = dbIngredient.imageUri;
      }

      // If changing step type, ensure unit is correct
      if (key === 'stepType') {
        if (value === 'weight') {
          updated.unit = 'g';
        } else if (value === 'weighable') {
          updated.unit = 'eggs';
        } else if (value === 'instruction') {
          updated.unit = '';
        }
      }

      console.log('Updated ingredient:', updated);
      return updated;
    });
  }, []);

  const handleAddIngredient = () => {
    const newIngredient = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      unit: 'g', // Default to grams
      tolerance: '',
      requireTare: false,
      instructionText: '',
      imageUri: null,
      stepType: 'weight', // Default to weight-based step
      requiresCheck: false
    };
    
    // Update local state
    const updatedIngredients = [...ingredients, newIngredient];
    setIngredients(updatedIngredients);
    
    // If we have an existing recipe, update AsyncStorage
    if (initialRecipe?.id) {
      const updatedRecipe = {
        ...initialRecipe,
        ingredients: updatedIngredients
      };
      
      // Update AsyncStorage
      AsyncStorage.getItem('recipes')
        .then(storedRecipesStr => {
          const storedRecipes = JSON.parse(storedRecipesStr);
          const updatedRecipes = storedRecipes.map(r => 
            r.id === initialRecipe.id ? updatedRecipe : r
          );
          return AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
        })
        .then(() => {
          console.log('Recipe updated in storage after adding ingredient');
        })
        .catch(error => {
          console.error('Error saving new ingredient:', error);
          Alert.alert('Error', 'Failed to save new ingredient');
        });
    }
    
    setSelectedIngredient(newIngredient);
  };

  const openIngredientEditor = (ingredient) => {
    setSelectedIngredient(ingredient);
  };

  const closeIngredientEditor = () => {
    setSelectedIngredient(null);
  };

  const saveIngredientChanges = async () => {
    console.log('Starting saveIngredientChanges...');
    console.log('Selected ingredient:', selectedIngredient);
    
    if (!selectedIngredient || !selectedIngredient.name || !selectedIngredient.amount) {
      console.log('Validation failed: missing selected ingredient, or its name or amount');
      Alert.alert('Error', 'Ingredient details, name, and amount are required');
      return;
    }

    try {
      console.log('Updating ingredients state...');
      // Update ingredients state
      const updatedIngredients = ingredients.map(ing => 
        ing.id === selectedIngredient.id ? selectedIngredient : ing
      );
      console.log('Updated ingredients (local state):', updatedIngredients);
      setIngredients(updatedIngredients);

      // Update AsyncStorage
      const storedRecipesStr = await AsyncStorage.getItem('recipes');
      if (storedRecipesStr) {
        const storedRecipes = JSON.parse(storedRecipesStr);
        let updatedRecipes;

        if (initialRecipe?.id) {
          // Updating existing recipe
          updatedRecipes = storedRecipes.map(r =>
            r.id === initialRecipe.id ? { ...r, ingredients: updatedIngredients } : r
          );
        } else {
          // New recipe - create it
          const newRecipe = {
            id: Date.now().toString(),
            title: title || 'New Recipe',
            imageUri: recipeImage || require('../assets/recipes/placeholder.png'),
            ingredients: updatedIngredients
          };
          updatedRecipes = [...storedRecipes, newRecipe];
        }

        await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
        console.log('Recipe saved to storage successfully');
        setRecipes(updatedRecipes);
      }

      // Show success message
      showSnackbar('Ingredient saved successfully');
      console.log('Closing ingredient editor...');
      closeIngredientEditor();
    } catch (error) {
      console.error('Error in saveIngredientChanges:', error);
      Alert.alert('Error', 'Failed to save ingredient changes');
    }
  };

  // Update useEffect to properly track original ingredient state
  useEffect(() => {
    if (selectedIngredient) {
      // Create a deep copy of the selected ingredient
      const original = {
        id: selectedIngredient.id,
        name: selectedIngredient.name,
        amount: selectedIngredient.amount,
        unit: selectedIngredient.unit,
        tolerance: selectedIngredient.tolerance || '', // Remove default value
        requireTare: selectedIngredient.requireTare,
        instructionText: selectedIngredient.instructionText,
        imageUri: selectedIngredient.imageUri,
        stepType: selectedIngredient.stepType,
        requiresCheck: selectedIngredient.requiresCheck
      };
      console.log('Setting original ingredient:', original);
      setOriginalIngredient(original);
    }
  }, [selectedIngredient?.id]);

  const hasIngredientChanges = useCallback(() => {
    if (!selectedIngredient || !originalIngredient) {
      console.log('No ingredient or original ingredient to compare');
      return false;
    }
    
    const changes = {
      name: selectedIngredient.name !== originalIngredient.name,
      amount: selectedIngredient.amount !== originalIngredient.amount,
      unit: selectedIngredient.unit !== originalIngredient.unit,
      tolerance: selectedIngredient.tolerance !== originalIngredient.tolerance,
      requireTare: selectedIngredient.requireTare !== originalIngredient.requireTare,
      instructionText: selectedIngredient.instructionText !== originalIngredient.instructionText,
      imageUri: selectedIngredient.imageUri !== originalIngredient.imageUri,
      stepType: selectedIngredient.stepType !== originalIngredient.stepType,
      requiresCheck: selectedIngredient.requiresCheck !== originalIngredient.requiresCheck
    };

    const hasChanges = Object.values(changes).some(change => change);
    
    console.log('Checking ingredient changes:', {
      selectedIngredient,
      originalIngredient,
      changes,
      hasChanges
    });
    
    return hasChanges;
  }, [selectedIngredient, originalIngredient]);

  const handleCloseIngredientEditor = useCallback(() => {
    console.log('Close ingredient editor clicked');
    const changes = hasIngredientChanges();
    console.log('Has changes:', changes);
    
    if (changes) {
      console.log('Showing unsaved changes dialog');
      setUnsavedIngredientDialog({ visible: true });
    } else {
      console.log('No changes, closing editor');
      setSelectedIngredient(null);
    }
  }, [hasIngredientChanges]);

  const handleIngredientBackPress = useCallback(() => {
    console.log('Back button pressed in ingredient editor');
    const changes = hasIngredientChanges();
    console.log('Has changes:', changes);
    
    if (changes) {
      console.log('Showing unsaved changes dialog');
      setUnsavedIngredientDialog({ visible: true });
    } else {
      console.log('No changes, closing editor');
      setSelectedIngredient(null);
    }
  }, [hasIngredientChanges]);

  const handleDiscardIngredientChanges = () => {
    console.log('Discarding ingredient changes');
    setUnsavedIngredientDialog({ visible: false });
    setSelectedIngredient(null);
  };

  const handleSaveIngredientChanges = async () => {
    console.log('Saving ingredient changes');
    setUnsavedIngredientDialog({ visible: false });
    await saveIngredientChanges();
  };

  const renderIngredientCard = useCallback((ingredient) => {
    const getStepTypeLabel = (stepType) => {
      switch (stepType) {
        case 'weight':
          return 'Weight-based';
        case 'weighable':
          return 'Eggs';
        case 'instruction':
          return 'Instruction';
        default:
          return 'Unknown Type';
      }
    };

    const getIngredientDetails = (ingredient) => {
      if (ingredient.stepType === 'weight') {
        return `${ingredient.amount}g ± ${ingredient.tolerance || '0'}g`;
      } else if (ingredient.stepType === 'weighable') {
        return `${ingredient.amount} eggs`;
      }
      return '';
    };

    return (
      <Card style={[styles.ingredientCard, { backgroundColor: '#f5f5f5' }]} key={ingredient.id}>
        <View style={styles.ingredientHeader}>
          <TouchableOpacity 
            style={styles.cardMainContent} 
            onPress={() => openIngredientEditor(ingredient)}
          >
            <Image
              source={getImageSource(ingredient.imageUri)}
              style={styles.ingredientThumb}
            />
            <View style={styles.ingredientInfo}>
              <Text style={styles.ingredientName}>{ingredient.name || 'New Step'}</Text>
              <Text style={styles.ingredientType}>{getStepTypeLabel(ingredient.stepType)}</Text>
              {(ingredient.stepType === 'weight' || ingredient.stepType === 'weighable') && (
                <Text style={styles.ingredientDetails}>
                  {getIngredientDetails(ingredient)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.iconButtons}>
            <IconButton 
              icon="pencil" 
              size={20} 
              color="#666" 
              onPress={() => openIngredientEditor(ingredient)}
            />
            <IconButton 
              icon="trash-can" 
              size={20} 
              color="#666"
              onPress={() => {
                console.log('Pressed delete for', ingredient);
                setDeleteIngredientDialog({
                  visible: true,
                  ingredient,
                });
              }}
            />
          </View>
        </View>
        <View style={styles.ingredientActions}>
          {ingredient.stepType === 'weight' && (
            <View style={styles.tareContainer}>
              <Checkbox
                status={ingredient.requireTare ? 'checked' : 'unchecked'}
                onPress={(e) => {
                  e.stopPropagation();
                  const updated = ingredients.map(ing =>
                    ing.id === ingredient.id
                      ? { ...ing, requireTare: !ing.requireTare }
                      : ing
                  );
                  setIngredients(updated);
                  AsyncStorage.setItem('recipes', JSON.stringify(recipes.map(r =>
                    r.id === initialRecipe.id ? { ...r, ingredients: updated } : r
                  ))).catch(error => {
                    console.error('Error saving tare status:', error);
                    Alert.alert('Error', 'Failed to save tare status');
                  });
                }}
                color="#666"
              />
              <Text style={styles.tareText}>Requires Tare</Text>
            </View>
          )}
          
          {ingredient.instructionText && (
            <Button
              mode="outlined"
              onPress={() => playInstructionAudio(ingredient.instructionText)}
              style={styles.playButton}
              color="#666"
            >
              Play Instructions
            </Button>
          )}
        </View>
      </Card>
    );
  }, [openIngredientEditor, handleDeleteIngredient, ingredients, initialRecipe, recipes]);

  // Update the ingredient editor modal layout
  if (selectedIngredient) {
    console.log('Rendering ingredient editor with selected ingredient:', selectedIngredient);
    const ingredientWithDefaults = {
      ...selectedIngredient,
      tolerance: selectedIngredient.tolerance || ''  // Remove default value
    };

    const getToleranceLabel = (unit) => {
      switch (unit) {
        case 'g':
          return 'Tolerance (grams)';
        case 'eggs':
          return 'Tolerance (eggs)';
        case 'tsp':
          return 'Tolerance (teaspoons)';
        case 'tbsp':
          return 'Tolerance (tablespoons)';
        default:
          return `Tolerance (${unit})`;
      }
    };

    const getTolerancePlaceholder = (unit) => {
      switch (unit) {
        case 'g':
          return 'e.g. 2';
        case 'eggs':
          return 'e.g. 0';
        case 'tsp':
          return 'e.g. 0.5';
        case 'tbsp':
          return 'e.g. 0.5';
        default:
          return 'e.g. 1';
      }
    };

    return (
      <>
        <View style={styles.container}>
          <View style={styles.header}>
            <IconButton 
              icon="arrow-left" 
              size={24} 
              onPress={handleIngredientBackPress}
              testID="back-ingredient-editor"
              iconColor="white"
            />
            <Text style={styles.headerText}>Edit Ingredient</Text>
            <IconButton 
              icon="close" 
              size={24} 
              onPress={handleCloseIngredientEditor}
              testID="close-ingredient-editor"
              iconColor="white"
            />
          </View>
          
          <View style={styles.editorContainer}>
            <View style={styles.horizontalEditor}>
              <View style={styles.imageSection}>
                <TouchableOpacity 
                  style={styles.imageContainer}
                  onPress={() => pickImage(false, ingredientWithDefaults.id)}
                >
                  <Image
                    source={getImageSource(ingredientWithDefaults.imageUri)}
                    style={styles.ingredientImage}
                  />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.editImageText}>Edit Cover</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formSection}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Ingredient Name</Text>
                  <TextInput
                    style={styles.input}
                    value={ingredientWithDefaults.name}
                    onChangeText={(text) => updateIngredient(ingredientWithDefaults.id, 'name', text)}
                    placeholder="Ingredient Name"
                  />

                  <View style={{ backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
                    <Text style={styles.label}>Step Type</Text>
                    <Picker
                      selectedValue={ingredientWithDefaults.stepType}
                      onValueChange={(itemValue) => {
                        updateIngredient(ingredientWithDefaults.id, 'stepType', itemValue);
                        // Reset relevant fields based on step type
                        if (itemValue === 'instruction') {
                          updateIngredient(ingredientWithDefaults.id, 'amount', '');
                          updateIngredient(ingredientWithDefaults.id, 'unit', '');
                          updateIngredient(ingredientWithDefaults.id, 'tolerance', '');
                          updateIngredient(ingredientWithDefaults.id, 'requireTare', false);
                        } else if (itemValue === 'weight') {
                          updateIngredient(ingredientWithDefaults.id, 'unit', 'g');
                        } else if (itemValue === 'weighable') {
                          updateIngredient(ingredientWithDefaults.id, 'unit', 'eggs');
                        }
                      }}
                      style={{ height: 44 }}
                    >
                      <Picker.Item label="Weight-based" value="weight" />
                      <Picker.Item label="Non-weight Weighable" value="weighable" />
                      <Picker.Item label="Instruction" value="instruction" />
                    </Picker>
                  </View>

                  {ingredientWithDefaults.stepType !== 'instruction' && (
                    <>
                      <View style={{ backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
                        <Text style={styles.label}>Unit</Text>
                        <Picker
                          selectedValue={ingredientWithDefaults.unit}
                          onValueChange={(itemValue) => {
                            updateIngredient(ingredientWithDefaults.id, 'unit', itemValue);
                            updateIngredient(ingredientWithDefaults.id, 'tolerance', '');
                          }}
                          style={{ height: 44 }}
                          enabled={ingredientWithDefaults.stepType !== 'instruction'}
                        >
                          {ingredientWithDefaults.stepType === 'weight' ? (
                            <Picker.Item label="Grams" value="g" />
                          ) : (
                            <>
                              <Picker.Item label="Eggs" value="eggs" />
                              <Picker.Item label="Teaspoons" value="tsp" />
                              <Picker.Item label="Tablespoons" value="tbsp" />
                            </>
                          )}
                        </Picker>
                      </View>

                      <Text style={styles.label}>
                        {ingredientWithDefaults.unit === 'g'
                          ? 'Mass (grams)'
                          : `Quantity (${ingredientWithDefaults.unit})`}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={ingredientWithDefaults.amount}
                        onChangeText={(text) => updateIngredient(ingredientWithDefaults.id, 'amount', text)}
                        placeholder={ingredientWithDefaults.unit === 'g' ? "Mass (grams)" : `Quantity (${ingredientWithDefaults.unit})`}
                        keyboardType="numeric"
                      />

                      {ingredientWithDefaults.stepType === 'weight' && (
                        <>
                          <Text style={styles.label}>Tolerance (grams)</Text>
                          <TextInput
                            style={styles.input}
                            value={ingredientWithDefaults.tolerance}
                            onChangeText={(text) => updateIngredient(ingredientWithDefaults.id, 'tolerance', text)}
                            placeholder="e.g. 2"
                            keyboardType="numeric"
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* Instruction text field for all step types */}
                  <Text style={styles.label}>Instruction Text</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={ingredientWithDefaults.instructionText}
                    onChangeText={(text) => updateIngredient(ingredientWithDefaults.id, 'instructionText', text)}
                    placeholder="Enter instruction text for audio guidance"
                    multiline
                  />

                  {ingredientWithDefaults.stepType === 'weight' && (
                    <View style={styles.checkboxContainer}>
                      <Checkbox
                        status={ingredientWithDefaults.requireTare ? 'checked' : 'unchecked'}
                        onPress={() => updateIngredient(ingredientWithDefaults.id, 'requireTare', !ingredientWithDefaults.requireTare)}
                        color="#666"
                      />
                      <Text style={styles.checkboxLabel}>Requires Tare</Text>
                    </View>
                  )}

                  {ingredientWithDefaults.stepType === 'instruction' && (
                    <View style={styles.checkboxContainer}>
                      <Checkbox
                        status={ingredientWithDefaults.requiresCheck ? 'checked' : 'unchecked'}
                        onPress={() => updateIngredient(ingredientWithDefaults.id, 'requiresCheck', !ingredientWithDefaults.requiresCheck)}
                        color="#666"
                      />
                      <Text style={styles.checkboxLabel}>Requires Baker Check</Text>
                    </View>
                  )}

                  <Button 
                    mode="outlined"
                    onPress={() => playInstructionAudio(ingredientWithDefaults.instructionText)}
                    disabled={!ingredientWithDefaults.instructionText}
                    style={styles.previewButton}
                    buttonColor="rgba(237, 237, 237, 0.78)"
                    textColor="black"
                  >
                    Preview Audio
                  </Button>
                </View>
              </ScrollView>
            </View>

            <Button 
              mode="contained" 
              onPress={handleSaveIngredientChanges}
              style={styles.saveButton}
              buttonColor="rgba(144, 238, 144, 0.8)"
              textColor="black"
            >
              Save Changes
            </Button>
          </View>
        </View>

        {/* Update the unsaved changes dialog */}
        <Dialog
          visible={unsavedIngredientDialog.visible}
          onDismiss={() => setUnsavedIngredientDialog({ visible: false })}
        >
          <Dialog.Title>Unsaved Changes</Dialog.Title>
          <Dialog.Content>
            <Text>You have unsaved changes. Would you like to save them?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={handleDiscardIngredientChanges}
              disabled={isIngredientNavigating}
              textColor="red"
            >
              Discard
            </Button>
            <Button 
              onPress={handleSaveIngredientChanges}
              disabled={isIngredientNavigating}
              textColor="green"
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
          wrapperStyle={styles.snackbarWrapper}
        >
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </Snackbar>
      </>
    );
  }

  // Update the main recipe view to use the new card renderer
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Edit Recipe</Text>
        </View>

        <TouchableOpacity 
          style={styles.recipeImageContainer}
          onPress={() => pickImage(true)}
        >
          <Image
            source={getImageSource(recipeImage)}
            style={styles.recipeImage}
          />
          <Text style={styles.editCoverText}>Edit Cover</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe Title"
          placeholderTextColor="#999"
        />

        {ingredients.map(renderIngredientCard)}

        <TouchableOpacity 
          style={styles.addIngredientButton}
          onPress={handleAddIngredient}
        >
          <IconButton icon="plus" size={30} />
        </TouchableOpacity>

        <Button 
          mode="contained" 
          onPress={handleSaveAndExit}
          style={styles.saveButton}
          buttonColor="rgba(144, 238, 144, 0.8)"
          textColor="black"
        >
          Save Recipe
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={unsavedChangesDialog.visible}
          onDismiss={() => {
            if (!isNavigating && !isSaving) {
              setUnsavedChangesDialog({ visible: false });
            }
          }}
          dismissable={!isNavigating && !isSaving}
        >
          <Dialog.Title>Unsaved Changes</Dialog.Title>
          <Dialog.Content>
            <Text>You have unsaved changes. Would you like to save them before leaving?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={handleDiscardChanges}
              textColor="#666"
              disabled={isNavigating || isSaving}
            >
              Discard Changes
            </Button>
            <Button 
              onPress={handleSaveChangesFromDialog}
              mode="contained"
              buttonColor="rgba(144, 238, 144, 0.8)"
              textColor="black"
              disabled={isNavigating || isSaving}
            >
              Save Changes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={deleteIngredientDialog.visible}
          onDismiss={() => setDeleteIngredientDialog({ visible: false, ingredient: null })}
        >
          <Dialog.Title>Delete Ingredient</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{deleteIngredientDialog.ingredient?.name}"? This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteIngredientDialog({ visible: false, ingredient: null })}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => handleDeleteIngredient(deleteIngredientDialog.ingredient.id)}
              style={styles.deleteDialogBtn}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        wrapperStyle={styles.snackbarWrapper}
      >
        <Text style={styles.snackbarText}>{snackbarMessage}</Text>
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#000',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  recipeImageContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editCoverText: {
    position: 'absolute',
    bottom: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    marginBottom: 16,
  },
  ingredientCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ingredientHeader: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  iconButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ingredientThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  ingredientType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ingredientDetails: {
    fontSize: 14,
    color: '#666',
  },
  ingredientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    backgroundColor: '#f5f5f5',
  },
  tareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tareText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  playButton: {
    marginLeft: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  instructionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    borderColor: '#4a90e2',
  },
  addIngredientButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  editorContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  horizontalEditor: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  imageSection: {
    width: '40%',
    paddingRight: 16,
  },
  formSection: {
    flex: 1,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  ingredientImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(237, 237, 237, 0.78)',
    padding: 8,
    alignItems: 'center',
  },
  editImageText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    elevation: 2,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    margin: 16,
  },
  snackbarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackbarText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  changeImageButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  cardMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteDialogBtn: {
    backgroundColor: 'red',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});
