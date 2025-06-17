import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import ScaleServiceFactory from '../services/ScaleServiceFactory';
import { ScaleServiceType } from '../constants/ScaleServices';

const MockScaleComponent = () => {
  const mockScaleService = ScaleServiceFactory.getService(ScaleServiceType.MOCK);

  const handleWeightUp = () => {
    mockScaleService.mockWeightChange(10); // Increase weight by 10g
  };

  const handleWeightDown = () => {
    mockScaleService.mockWeightChange(-10); // Decrease weight by 10g
  };

  const handleStableWeight = () => {
    mockScaleService.mockStableWeight();
  };

  const handleTare = () => {
    mockScaleService.mockTare();
  };

  return (
    <View style={styles.container}>
      <Button title="Weight Up" onPress={handleWeightUp} />
      <Button title="Weight Down" onPress={handleWeightDown} />
      <Button title="Stable Weight" onPress={handleStableWeight} />
      <Button title="Tare" onPress={handleTare} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column', // Changed to column for vertical buttons
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
  },
});

export default MockScaleComponent;
