import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, Image, TouchableOpacity, Platform,
} from 'react-native';
import { Button, Snackbar, Dialog, Portal } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleRecipes } from '../data/sampleRecipes';

export default function InstructorScreen({ navigation }) {
  const [recipes, setRecipes] = useState(sampleRecipes);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, id: null, title: '' });

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        console.log('Loading recipes from storage...');
        const data = await AsyncStorage.getItem('recipes');
        if (data) {
          const parsed = JSON.parse(data);
          console.log('Loaded recipes count:', parsed.length);
          setRecipes(parsed);
        }
      } catch (error) {
        console.error('Failed to load recipes:', error);
      }
    };

    // Load recipes immediately
    loadRecipes();

    // Also load recipes when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadRecipes);
    return unsubscribe;
  }, [navigation]);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const saveRecipes = async (newRecipes) => {
    try {
      console.log('Saving recipes, count:', newRecipes.length);
      await AsyncStorage.setItem('recipes', JSON.stringify(newRecipes));
      setRecipes(newRecipes);
      console.log('Recipes saved successfully');
    } catch (error) {
      console.error('Error saving recipes:', error);
      throw error;
    }
  };

  const deleteRecipe = async (id, title) => {
    try {
      console.log('Deleting recipe:', id, title);
      const filtered = recipes.filter((recipe) => recipe.id !== id);
      console.log('Filtered recipes length:', filtered.length);
      await saveRecipes(filtered);
      showSnackbar(`${title} deleted successfully`);
      
      // Force a re-render by updating state
      setRecipes([...filtered]);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      Alert.alert(
        'Error',
        'Failed to delete recipe. Please try again.'
      );
    }
  };

  const confirmDelete = (id, title) => {
    console.log('Showing delete confirmation for:', id, title);
    setDeleteDialog({ visible: true, id, title });
  };

  const handleDeleteConfirm = () => {
    console.log('Delete confirmed for:', deleteDialog.id, deleteDialog.title);
    deleteRecipe(deleteDialog.id, deleteDialog.title);
    setDeleteDialog({ visible: false, id: null, title: '' });
  };

  const handleDeleteCancel = () => {
    console.log('Delete cancelled');
    setDeleteDialog({ visible: false, id: null, title: '' });
  };

  const handleEdit = (recipe) => {
    navigation.navigate('EditRecipe', { 
      recipe,
      onSave: async (updatedRecipe) => {
        const updatedRecipes = recipes.map(r => 
          r.id === updatedRecipe.id ? updatedRecipe : r
        );
        await saveRecipes(updatedRecipes);
        showSnackbar(`${updatedRecipe.title} updated successfully`);
      }
    });
  };

  const renderItem = ({ item }) => {
    if (item.isAddButton) {
      return (
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={[styles.card, styles.addCard]} 
            onPress={() => navigation.navigate('EditRecipe', { 
              recipe: null,
              onSave: async (newRecipe) => {
                const newRecipes = [...recipes, newRecipe];
                await saveRecipes(newRecipes);
                showSnackbar(`${newRecipe.title} created successfully`);
              }
            })}
          >
            <View style={styles.addCardContent}>
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addText}>Add New Recipe</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (item.isBulkButton) {
      return (
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={[styles.card, styles.addCard]} 
            onPress={() => {/* future bulk load action */}}
          >
            <View style={styles.addCardContent}>
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addText}>Bulk Load Recipes</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.isPlaceholder) {
      return <View style={styles.cardContainer} />;
    }

    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Image 
            source={item.imageUri}
            style={styles.image} 
            defaultSource={require('../assets/placeholder.png')}
            onError={(error) => console.log('Image loading error for', item.title, ':', error)}
            resizeMode="cover"
          />
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <View style={styles.buttonRow}>
          <Button 
            mode="contained" 
            onPress={() => {
              console.log('Delete button pressed for recipe:', item.id, item.title);
              confirmDelete(item.id, item.title);
            }} 
            style={styles.deleteBtn}
            labelStyle={styles.buttonLabel}
            compact>Delete</Button>
          <Button 
            mode="contained" 
            onPress={() => handleEdit(item)} 
            style={styles.editBtn}
            labelStyle={styles.buttonLabel}
            compact>Edit</Button>
        </View>
      </View>
    );
  };

  // Calculate padding needed to maintain 3x3 grid
  const calculatePaddingItems = (recipesLength) => {
    // Calculate how many items we need in the last row to put add/bulk buttons together
    const itemsInLastRow = recipesLength % 3;
    const paddingNeeded = itemsInLastRow === 0 ? 1 : (3 - itemsInLastRow - 2);
    return Array(Math.max(0, paddingNeeded)).fill({ id: 'padding', isPlaceholder: true });
  };

  // Add the action buttons and padding to maintain grid
  const allItems = [
    ...recipes,
    { id: 'add-button', isAddButton: true },
    { id: 'bulk-button', isBulkButton: true },
    ...calculatePaddingItems(recipes.length),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Recipes</Text>
      <FlatList
        data={allItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity
        style={styles.bakerViewBtn}
        onPress={() => navigation.navigate('BakerView')}
      >
        <Text style={styles.bakerText}>Baker View</Text>
      </TouchableOpacity>

      <Portal>
        <Dialog visible={deleteDialog.visible} onDismiss={handleDeleteCancel}>
          <Dialog.Title>Delete Recipe</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete "{deleteDialog.title}"? This cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleDeleteCancel}>Cancel</Button>
            <Button mode="contained" onPress={handleDeleteConfirm} style={styles.deleteDialogBtn}>
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
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#f2f2f2',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 16,
  },
  cardContainer: {
    width: '31%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    height: 200,
  },
  image: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
    gap: 4,
  },
  deleteBtn: {
    backgroundColor: '#ff5c5c',
    flex: 1,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: '#4CAF50',
    flex: 1,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 13,
    marginVertical: 4,
    color: '#fff',
  },
  addCard: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ccc',
    padding: 16,
  },
  addCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 40,
    color: '#666',
    marginBottom: 8,
  },
  addText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  bakerViewBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bakerText: {
    fontSize: 16,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#333',
  },
  deleteDialogBtn: {
    backgroundColor: '#ff5c5c',
    marginLeft: 8,
  },
});
