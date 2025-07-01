import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
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

  useEffect(() => {
    const requestBluetoothPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          if (Platform.Version >= 31) { // Android 12+
            const permissions = [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ];
            const granted = await PermissionsAndroid.requestMultiple(permissions);
            const allPermissionsGranted = Object.values(granted).every(
              status => status === PermissionsAndroid.RESULTS.GRANTED
            );

            if (allPermissionsGranted) {
              console.log('Bluetooth permissions for Android 12+ granted');
            } else {
              console.log('One or more Bluetooth permissions for Android 12+ denied');
            }
          } else { // Android 11 or lower
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: 'Location Permission for Bluetooth',
                message:
                  'This app needs access to your location to discover nearby Bluetooth devices.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              console.log('Location permission for Bluetooth granted');
            } else {
              console.log('Location permission for Bluetooth denied');
            }
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };

    requestBluetoothPermission();
  }, []);

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