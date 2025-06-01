import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
=======
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
import { Searchbar, FAB, IconButton } from 'react-native-paper';
import RecipeService from '../services/RecipeService'; // Import RecipeService

export default function RecipeListScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);

<<<<<<< HEAD

  useEffect(() => {
    const initAndLoad = async () => {
      await RecipeService.resetRecipesToSampleData();
; // Ensure sample data is loaded if not present
=======
  useEffect(() => {
    const initAndLoad = async () => {
      await RecipeService.initializeRecipes(); // Ensure sample data is loaded if not present
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
      loadRecipes();
    };
    initAndLoad();
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
      const loadedRecipes = await RecipeService.getRecipes();
<<<<<<< HEAD
      console.log('Loaded recipes:', loadedRecipes);
=======
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
      setRecipes(loadedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]); // Fallback to empty array on error
    }
  };

  const onChangeSearch = query => setSearchQuery(query);

<<<<<<< HEAD
  const renderRecipeCard = ({ item }) => {
    console.log('Rendering recipe:', item.title, item.imageUri);

    return (
      <TouchableOpacity 
        style={styles.recipeCard}
        onPress={() => navigation.navigate('Recipe Details', { recipeId: item.id })}
      >
        {item.imageUri && (
        <Image 
          source={{ uri: item.imageUri }}
          style={styles.recipeImage}
          resizeMode="cover"
        />
      )}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };
=======
  const renderRecipeCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => navigation.navigate('Recipe Details', { recipeId: item.id })}
    >
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        {/* Removed recipeMetaContainer as sample recipes don't have prepTime, cookTime, difficulty */}
      </View>
    </TouchableOpacity>
  );
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5

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
<<<<<<< HEAD
    flexDirection: 'row',
    alignContent: 'center',
    alignSelf: 'center'
  },
  recipeCard: {
    backgroundColor: '#fff',
    height: 350,
    width: 500,
    borderRadius: 8,
    padding: 20,
    marginRight: 20,
    marginBottom: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
=======
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
    elevation: 2,
  },
  recipeInfo: {
    flex: 1,
<<<<<<< HEAD
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recipeImage: {
    height: '70%',
    width: '70%',
    aspectRatio: 1,
    borderRadius: 8,
    marginTop: 8
  },
=======
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
  recipeMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recipeMeta: {
<<<<<<< HEAD
    fontSize: 16,
=======
    fontSize: 14,
>>>>>>> 6d9c56f77b2b59bdc38776e83ade8d531cef51e5
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
