import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconButton } from 'react-native-paper';

export default function EditRecipeScreen({ route, navigation }) {
  const { recipe } = route.params || {};
  const [title, setTitle] = useState(recipe?.title || '');
  const [ingredients, setIngredients] = useState(recipe?.ingredients || []);

  useEffect(() => {
    if (!recipe) {
      setIngredients([{ name: '', amount: '', unit: 'g', tolerance: '' }]);
    }
  }, []);

  const updateIngredient = (index, key, value) => {
    const updated = [...ingredients];
    updated[index][key] = value;
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'g', tolerance: '' }]);
  };

  const deleteIngredient = (index) => {
    if (ingredients.length === 1) {
      Alert.alert('At least one ingredient is required.');
      return;
    }
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  const saveRecipe = async () => {
    const newRecipe = {
      id: recipe?.id || Date.now().toString(),
      title,
      ingredients,
      prepTime: recipe?.prepTime || 'x mins',
      cookTime: recipe?.cookTime || 'x mins',
    };

    try {
      const existingData = await AsyncStorage.getItem('recipes');
      const recipes = existingData ? JSON.parse(existingData) : [];

      const updatedRecipes = recipe
        ? recipes.map(r => (r.id === recipe.id ? newRecipe : r))
        : [...recipes, newRecipe];

      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save recipe:', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Black header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Edit Recipes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          style={styles.recipeTitleInput}
          placeholder="Recipe Title"
          value={title}
          onChangeText={setTitle}
        />

        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Ingredient {index + 1}</Text>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => deleteIngredient(index)}
              />
            </View>

            <TextInput
              style={styles.name}
              placeholder="Ingredient Title"
              value={ingredient.name}
              onChangeText={(text) => updateIngredient(index, 'name', text)}
            />

            <TextInput
              style={styles.amount}
              placeholder="Amount"
              keyboardType="numeric"
              value={ingredient.amount.toString()}
              onChangeText={(text) => updateIngredient(index, 'amount', text)}
            />

            <View style={styles.units}>
              {['g', 'kg'].map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    ingredient.unit === unit && styles.unitSelected,
                  ]}
                  onPress={() => updateIngredient(index, 'unit', unit)}
                >
                  <Text style={styles.unitText}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.toleranceLabel}>Tolerance</Text>
            <TextInput
              style={styles.tolerance}
              placeholder="e.g. ±0.05%"
              value={ingredient.tolerance}
              onChangeText={(text) => updateIngredient(index, 'tolerance', text)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
          <Text style={styles.addButtonText}>+ Add Ingredient</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveRecipe}>
          <Text style={styles.saveButtonText}>Save Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: '#000',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  recipeTitleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#eee',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    marginBottom: 8,
  },
  units: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  unitButton: {
    backgroundColor: '#999',
    padding: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  unitSelected: {
    backgroundColor: '#555',
  },
  unitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toleranceLabel: {
    fontSize: 14,
    color: '#444',
  },
  tolerance: {
    fontSize: 14,
    borderBottomWidth: 1,
    borderColor: '#aaa',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
