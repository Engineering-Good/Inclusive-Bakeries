import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { IconButton, FAB } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InstructorScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);

  // Load recipes when the screen is focused
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await AsyncStorage.getItem('recipes');
        if (data) {
          setRecipes(JSON.parse(data));
        }
      } catch (error) {
        console.error('Failed to load recipes:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadRecipes);
    return unsubscribe;
  }, [navigation]);

  // Delete recipe by id and update AsyncStorage
  const deleteRecipe = async (id) => {
    const filtered = recipes.filter((recipe) => recipe.id !== id);
    setRecipes(filtered);
    await AsyncStorage.setItem('recipes', JSON.stringify(filtered));
  };

  // Show confirmation alert before deletion
  const confirmDelete = (id) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecipe(id) },
    ]);
  };

  // Render each recipe in the list
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>Prep: {item.prepTime} | Cook: {item.cookTime}</Text>
      </View>
      {/* Edit Button */}
      <IconButton icon="pencil" onPress={() => navigation.navigate('EditRecipe', { recipe: item })} />
      {/* Delete Button - triggers confirmDelete */}
      <IconButton icon="delete-outline" onPress={() => confirmDelete(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      {/* Add Recipe Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('EditRecipe', { recipe: null })}
        label="Add Recipe"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4CAF50',
  },
});
