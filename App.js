import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';

import RecipeListScreen from './src/screens/RecipeListScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import IngredientScreen from './src/screens/IngredientScreen';
import CelebrationScreen from './src/screens/CelebrationScreen';
import InstructorScreen from './src/screens/InstructorScreen';
import EditRecipeScreen from './src/screens/EditRecipeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
         screenOptions={{
          contentStyle: {
            zIndex: 0, // Keep screen content below header
          },
        }}>
          <Stack.Screen name="Recipes" component={RecipeListScreen} />
          <Stack.Screen name="Recipe Details" component={RecipeDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Ingredient" component={IngredientScreen} />
          <Stack.Screen name="Instructor" component={InstructorScreen} />
          <Stack.Screen name="EditRecipe" component={EditRecipeScreen}/>
          <Stack.Screen name="Celebration" component={CelebrationScreen} 
            options={{
              headerLeft: () => null, // Remove back button
              gestureEnabled: false,  // Disable swipe back gesture
              headerBackVisible: false,
              headerTitle: 'Completed!',
            }}/> 
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}