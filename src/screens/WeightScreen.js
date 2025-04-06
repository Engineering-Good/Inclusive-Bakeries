import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

const FlourScreen = () => {
  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.title}>115g Flour</Text>
      </View>

      {/* Middle Section */}
      <View style={styles.middleSection}>
        <Text style={styles.addMoreText}>Add more</Text>
        <Text style={styles.quantityText}>0g</Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.nextButton}>
          <Text style={styles.nextButtonText}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', // Assuming a white background for the overall page
  },
  topSection: {
    backgroundColor: 'white', // Or any color you prefer for the top bar
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // You might want to add elevation or shadow for a distinct header
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  middleSection: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quantityText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  bottomSection: {
    backgroundColor: 'white', // Or any color for the bottom section
    padding: 20,
    alignItems: 'flex-end',
  },
  nextButton: {
    backgroundColor: 'lightgreen', // Approximate color from the screenshot
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5, // Optional: for rounded corners
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5, // Space for the arrow if you implement it as text
  },
});

export default FlourScreen;