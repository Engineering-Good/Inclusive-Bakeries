import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Searchbar, FAB, IconButton } from 'react-native-paper';
import RecipeService from '../services/RecipeService';

export default function RecipeListScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  // Load recipes from storage
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        console.log('[RecipeListScreen] Loading recipes...');
        const loadedRecipes = await RecipeService.getRecipes();
        console.log('[RecipeListScreen] Recipes loaded:', loadedRecipes.length);
        setRecipes(loadedRecipes);
      } catch (error) {
        console.error('[RecipeListScreen] Failed to load recipes:', error);
      }
    };

    // Load recipes immediately
    loadRecipes();

    // Also load recipes when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', loadRecipes);
    return unsubscribe;
  }, [navigation]);

  // Filter recipes based on search query
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

  const onChangeSearch = query => setSearchQuery(query);

  const renderRecipeCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => navigation.navigate('Recipe Details', { recipeId: item.id })}
    >
      <View style={styles.recipeInfo}>
        {item.imageUri && (
          <Image
            source={typeof item.imageUri === 'string' ? { uri: item.imageUri } : item.imageUri}
            style={styles.recipeImage}
            defaultSource={require('../assets/placeholder.png')}
          />
        )}
        <Text style={styles.recipeTitle}>{item.title}</Text>
        {/* Removed recipeMetaContainer as sample recipes don't have prepTime, cookTime, difficulty */}
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
        icon="account-circle"
        onPress={() => navigation.navigate('Instructor')}
        label="Instructor View"
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
  recipeImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    marginBottom: 8,
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
    backgroundColor: '#878787',
  },
  headerButton: {
    marginRight: 8,
  },
});
