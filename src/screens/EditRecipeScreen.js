import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { IconButton, Button, Checkbox, Card, Snackbar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dialog, Portal } from 'react-native-paper';


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
      
      // Update AsyncStorage if we have an existing recipe
      if (initialRecipe?.id) {
        const storedRecipesStr = await AsyncStorage.getItem('recipes');
        if (storedRecipesStr) {
          const storedRecipes = JSON.parse(storedRecipesStr);
          const updatedRecipes = storedRecipes.map(r => 
            r.id === initialRecipe.id ? { ...r, ingredients: updatedIngredients } : r
          );
          
          await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
          setRecipes(updatedRecipes); // Update local recipes state
        }
      }
  
      // Call onSave callback if it exists
      if (onSave) {
        const updatedRecipe = {
          ...initialRecipe,
          ingredients: updatedIngredients
        };
        await onSave(updatedRecipe);
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
  }, [ingredients, initialRecipe, onSave, selectedIngredient, showSnackbar, recipes]);

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
        unit: 'g',
        tolerance: '',
        imageUri: null,
        requireTare: false,
        instructionText: ''
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
        setRecipeImage(result.assets[0]);
      } else {
        updateIngredient(ingredientId, 'imageUri', result.assets[0]);
      }
    }
  };

  const updateIngredient = useCallback((id, key, value) => {
    const processedValue = key === 'imageUri' && typeof value === 'object' && value.uri 
      ? value.uri 
      : value;
  
    setIngredients(prevIngredients =>
      prevIngredients.map(ingredient =>
        ingredient.id === id ? {
          ...ingredient,
          [key]: processedValue
        } : ingredient
      )
    );
  
    // Update selectedIngredient if it's the same ingredient being updated
    setSelectedIngredient(prev => 
      prev && prev.id === id ? {
        ...prev,
        [key]: processedValue
      } : prev
    );
  }, []);

  const addIngredient = () => {
    const newIngredient = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      unit: 'g',
      tolerance: '',
      imageUri: null,
      requireTare: false,
      instructionText: ''
    };
    setIngredients([...ingredients, newIngredient]);
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

      // Only update AsyncStorage for the main recipes list if editing an existing recipe
      if (initialRecipe && initialRecipe.id) {
        console.log('Preparing to update AsyncStorage for existing recipe ID:', initialRecipe.id);
        // const currentRecipes = recipes; // recipes state should be up-to-date
        const updatedRecipesList = recipes.map(r =>
          r.id === initialRecipe.id ? { ...r, ingredients: updatedIngredients } : r
        );
        console.log('Updated recipes list to save to AsyncStorage:', updatedRecipesList);
        
        await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipesList));
        console.log('AsyncStorage updated successfully for existing recipe.');
        setRecipes(updatedRecipesList); // Keep the main recipes state in sync
      } else {
        console.log('New recipe mode: Ingredient changes are local. Full recipe save will persist them.');
      }

      // Show success message
      showSnackbar('Ingredient updated successfully');
      console.log('Closing ingredient editor...');
      closeIngredientEditor();
    } catch (error) {
      console.error('Error in saveIngredientChanges:', error);
      Alert.alert('Error', 'Failed to save ingredient changes');
    }
  };

  

  const saveRecipe = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Recipe title is required');
      return;
    }
  
    // Create instructions array from ingredient instructionTexts
    const instructions = ingredients
      .filter(ing => ing.instructionText && ing.instructionText.trim()) // Only include ingredients with instructions
      .map(ing => ing.instructionText.trim());
  
    const updatedRecipe = {
      id: initialRecipe?.id || Date.now().toString(),
      title,
      imageUri: recipeImage?.uri || recipeImage || require('../assets/recipes/placeholder.png'),
      ingredients: ingredients.map(ing => ({
        ...ing,
        imageUri: ing.imageUri || require('../assets/recipes/placeholder.png')
      })),
      instructions // Use the generated instructions array
    };
  
    try {
      if (onSave) {
        await onSave(updatedRecipe);
      }
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save recipe:', e);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  const handleDeleteIngredientCancel = () => {
    setDeleteIngredientDialog({ visible: false, ingredient: null });
  };
  
  const handleDeleteIngredientConfirm = async () => {
    if (deleteIngredientDialog.ingredient) {
      await handleDeleteIngredient(deleteIngredientDialog.ingredient.id);
    }
    setDeleteIngredientDialog({ visible: false, ingredient: null });
  };  

  const renderIngredientCard = useCallback((ingredient) => {
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
              <Text style={styles.ingredientName}>{ingredient.name || 'New Ingredient'}</Text>
              <Text style={styles.ingredientDetails}>
                Mass: {ingredient.amount}g ± {ingredient.tolerance}%
              </Text>
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
          
          <Button
            mode="outlined"
            onPress={() => playInstructionAudio(ingredient.instructionText)}
            disabled={!ingredient.instructionText}
            style={styles.playButton}
            color="#666"
          >
            Play Instructions
          </Button>
        </View>
      </Card>
    );
    
  }, [openIngredientEditor, handleDeleteIngredient, ingredients, initialRecipe, recipes]);

  // Update the ingredient editor modal layout
  if (selectedIngredient) {
    return (
      <>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Edit Ingredient</Text>
            <IconButton icon="close" size={24} onPress={closeIngredientEditor} />
          </View>
          
          <View style={styles.editorContainer}>
            <View style={styles.horizontalEditor}>
              <View style={styles.imageSection}>
                <TouchableOpacity 
                  style={styles.imageContainer}
                  onPress={() => pickImage(false, selectedIngredient.id)}
                >
                <Image
                  source={getImageSource(selectedIngredient.imageUri)}
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
                    value={selectedIngredient.name}
                    onChangeText={(text) => setSelectedIngredient({...selectedIngredient, name: text})}
                    placeholder="Ingredient Name"
                  />

                  <Text style={styles.label}>Mass (grams)</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedIngredient.amount}
                    onChangeText={(text) => setSelectedIngredient({...selectedIngredient, amount: text})}
                    keyboardType="numeric"
                    placeholder="Amount"
                  />

                  <Text style={styles.label}>Tolerance (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedIngredient.tolerance}
                    onChangeText={(text) => setSelectedIngredient({...selectedIngredient, tolerance: text})}
                    placeholder="e.g. 0.1"
                    keyboardType="numeric"
                  />

                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      status={selectedIngredient.requireTare ? 'checked' : 'unchecked'}
                      onPress={() => setSelectedIngredient({
                        ...selectedIngredient,
                        requireTare: !selectedIngredient.requireTare
                      })}
                      color="#666"
                    />
                    <Text style={styles.checkboxLabel}>Requires Tare</Text>
                  </View>

                  <Text style={styles.label}>Instruction Text (for Audio)</Text>
                  <TextInput
                    style={[styles.input, styles.instructionInput]}
                    value={selectedIngredient.instructionText}
                    onChangeText={(text) => setSelectedIngredient({...selectedIngredient, instructionText: text})}
                    placeholder="Enter instructions for text-to-speech"
                    multiline
                    numberOfLines={3}
                  />

                  <Button 
                    mode="outlined"
                    onPress={() => playInstructionAudio(selectedIngredient.instructionText)}
                    disabled={!selectedIngredient.instructionText}
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
              onPress={saveIngredientChanges}
              style={styles.saveButton}
              buttonColor="rgba(144, 238, 144, 0.8)"
              textColor="black"
            >
              Save Changes
            </Button>
          </View>
        </View>
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
          onPress={addIngredient}
        >
          <IconButton icon="plus" size={30} />
        </TouchableOpacity>

        <Button 
          mode="contained" 
          onPress={saveRecipe}
          style={styles.saveButton}
          buttonColor="rgba(144, 238, 144, 0.8)"
          textColor="black"
        >
          Save Recipe
        </Button>
      </ScrollView>
      <Portal>
      <Dialog
      visible={deleteIngredientDialog?.visible || false}
      onDismiss={handleDeleteIngredientCancel}
        >
        <Dialog.Title>Delete Ingredient</Dialog.Title>
        <Dialog.Content>
          <Text>
            Are you sure you want to delete "{deleteIngredientDialog.ingredient?.name}"? This cannot be undone.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDeleteIngredientCancel}>Cancel</Button>
          <Button
            mode="contained"
            onPress={handleDeleteIngredientConfirm}
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
});
