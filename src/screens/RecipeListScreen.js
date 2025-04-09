import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Searchbar, FAB, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample data for initial testing
const SAMPLE_RECIPES = [
  {
    id: '1',
    title: 'Chocolate Chip Brownies',
    prepTime: '15 mins',
    cookTime: '10 mins',
    difficulty: 'Easy',
    instructions: ['Preheat oven to 350°F. Mix flour, baking soda, and salt in a bowl. In a separate bowl, cream butter and sugars. Add eggs and vanilla, then mix in dry ingredients. Stir in chocolate chips. Drop spoonfuls of dough onto baking sheet and bake for 10 minutes.'],
    ingredients: [
      { name: 'Flour', amount: 160, unit: 'g' },
     // { name: 'Sugar', amount: 160, unit: 'g' },
      { name: 'Butter', amount: 180, unit: 'g' }],
    imageUri: null,
  },
  {
    id: '2',
    title: 'Classic Pancakes',
    prepTime: '10 mins',
    cookTime: '15 mins',
    difficulty: 'Easy',
    instructions: ['Mix flour, sugar, baking powder, and salt in a bowl. In a separate bowl, whisk together milk, egg, and melted butter. Combine wet and dry ingredients, then cook on a hot griddle until bubbles form. Flip and cook until golden brown.'],
    ingredients: [
      { name: 'Flour', amount: 150, unit: 'g' },
      { name: 'Sugar', amount: 100, unit: 'g' },
      { name: 'Butter', amount: 120, unit: 'g' }],
    imageUri: null,
  },
  {
    id: '3',
    title: 'Beef Stir Fry',
    prepTime: '20 mins',
    cookTime: '15 mins',
    difficulty: 'Medium',
    instructions: ['Slice beef into thin strips and marinate in soy sauce and cornstarch. Heat oil in a wok and stir-fry beef until browned. Add garlic, ginger, and vegetables. Stir in soy sauce and oyster sauce. Serve over rice.'],
    ingredients: [
      { name: 'Flour', amount: 150, unit: 'g' },
      { name: 'Sugar', amount: 100, unit: 'g' },
      { name: 'Butter', amount: 120, unit: 'g' }],
    imageUri: null,
  }
];

export default function RecipeListScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredRecipes(recipes);
    } else {
      const filtered = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes]);

  useEffect(() => {
    // Set up the header right button
    navigation.setOptions({
      headerTitle: () => <View><Text>My Recipes</Text></View>, // Empty view as header title
      headerRight: () => (
        
        <View>
          
        <IconButton
          icon="cog"
          size={48}
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerButton}
        />
        </View>
      ),
    });
  }, [navigation]);

  const loadRecipes = async () => {
    try {
    //   const savedRecipes = await AsyncStorage.getItem('recipes');
    //   if (savedRecipes !== null) {
    //     setRecipes(JSON.parse(savedRecipes));
    //   } else {
        // Use sample data for first launch
        setRecipes(SAMPLE_RECIPES);
        await AsyncStorage.setItem('recipes', JSON.stringify(SAMPLE_RECIPES));
      //}
    } catch (error) {
      console.error('Error loading recipes:', error);
      // Fallback to sample data
      setRecipes(SAMPLE_RECIPES);
    }
  };

  const onChangeSearch = query => setSearchQuery(query);

  const renderRecipeCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => navigation.navigate('Recipe Details', { recipeId: item.id })}
    >
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <View style={styles.recipeMetaContainer}>
          <Text style={styles.recipeMeta}>Prep: {item.prepTime}</Text>
          <Text style={styles.recipeMeta}>Cook: {item.cookTime}</Text>
          <Text style={styles.recipeMeta}>Difficulty: {item.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <Searchbar
        placeholder="Search recipes"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Settings')}
        label="Add Recipe"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for FAB
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 2,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recipeMeta: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  headerButton: {
    marginRight: 8,
  },
});