import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import ScaleServiceFactory from '../services/ScaleServiceFactory';

const MockScaleComponent = () => {
  const [mockScaleService, setMockScaleService] = useState(null);

  useEffect(() => {
    const initializeScaleService = async () => {
      const service = await ScaleServiceFactory.getScaleService();
      setMockScaleService(service);
      console.log('MockScaleComponent initialized with service:', service);
    };
    initializeScaleService();
  }, []);

  const handleWeightUp = () => {
    if (!mockScaleService) return;
    mockScaleService.mockWeightChange(10); // Increase weight by 10g
  };

  const handleWeightDown = () => {
    if (!mockScaleService) return;
    mockScaleService.mockWeightChange(-10); // Decrease weight by 10g
  };

  const handleStableWeight = () => {
    if (!mockScaleService) return;
    mockScaleService.mockStableWeight();
  };

  const handleTare = () => {
    if (!mockScaleService) return;
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
    padding: 20,
    width: '100%',
  },
});

export default MockScaleComponent;
