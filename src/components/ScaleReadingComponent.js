import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { ProgressBar } from "react-native-paper";
import SpeechService from "../services/SpeechService";
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import ScaleConnectButton from "./ScaleConnectButton";


// Add at the top of the file, after imports
const screenWidth = Dimensions.get('window').width;

const ScaleReadingComponent = ({ 
  targetIngredient, 
  onProgressUpdate, 
  onWeightData, 
  requireTare 
}) => {
  const [currentWeight, setCurrentWeight] = useState(0);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTared, setIsTared] = useState(false);
  const [shouldTare, setShouldTare] = useState(requireTare);
  const hasSpokenRef = useRef(false);
  const targetWeight = targetIngredient?.amount || 0;

  // Reset states when ingredient changes
  useEffect(() => {
    // Reset states but don't unsubscribe from scale
    hasSpokenRef.current = false;
    setIsTared(false);
    setCurrentWeight(0);
  }, [targetIngredient]);

  // Replace the cleanup effect with this updated version
  useEffect(() => {
    return () => {
      // Always do full cleanup on unmount
      ScaleServiceFactory.unsubscribeAll();
      setIsConnected(false);
      setCurrentWeight(0);
      setIsTared(false);
      hasSpokenRef.current = false;
      SpeechService.stop();
    };
  }, []); // Empty dependency array ensures this runs only on unmount


  // Check connection status periodically
  useEffect(() => {
    const checkConnection = () => {
      const status = ScaleServiceFactory.getConnectionStatus();
      setIsConnected(status.isConnected);
    };

    // Check immediately
    checkConnection();

    // Check every 2 seconds
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleWeightUpdate = (weightData) => {
      console.log('[ScaleReadingComponent] Weight update:', weightData);
      if(!targetIngredient){
        console.log('[ScaleReadingComponent] No target ingredient, ignoring weight update');
        return;
      }
      // Handle tare event
      if (weightData.isTare) {
        console.log('[ScaleReadingComponent] Tare detected');
        setIsTared(true);
        return;
      }

      // Announce tare needed if there's weight and not tared
      if (requireTare && !isTared && weightData.value > 0 && (!hasSpokenRef.current || hasSpokenRef.current !== 'tare')) {
        SpeechService.speak('Please tare the scale');
        hasSpokenRef.current = 'tare';
        return;
      }
  
      console.log('[ScaleReadingComponent] Tare:', requireTare, 'Is Tared:', isTared);
      
      if (!requireTare || isTared) {
        console.log('[ScaleReadingComponent] Processing weight after tare check, targetIngredient:', targetIngredient);
        setCurrentWeight(weightData.value);
        
        const newProgress = weightData.value / targetIngredient?.amount || 0;
        onProgressUpdate(newProgress);
      }
  
      onWeightData?.(weightData);
    };
  
    // Subscribe to weight updates
    const unsubscribe = ScaleServiceFactory.subscribeToWeightUpdates(handleWeightUpdate);
     // Only unsubscribe from weight updates if component is being unmounted completely
     return () => {
        unsubscribe();
     };
  }, [isTared, requireTare, targetIngredient, onProgressUpdate, onWeightData]);

  // Update shouldTare when requireTare or isTared changes
  useEffect(() => {
    setShouldTare(requireTare && !isTared);
  }, [requireTare, isTared]);

  // Reset states when ingredient changes
  useEffect(() => {
    hasSpokenRef.current = false;
    setIsTared(false);
    setCurrentWeight(0);
    setShouldTare(requireTare);
  }, [targetIngredient, requireTare]);

  const progress = (!requireTare || isTared) ? (currentWeight / targetWeight) : 0;

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {!isConnected ? (
        <View style={styles.connectContainer}>
          <Text style={styles.connectText}>Scale not connected</Text>
          <ScaleConnectButton />
        </View>
      ) : (
        <>
          <View style={styles.weightContainer}>
            <Text style={styles.weightText}>
              {targetIngredient && shouldTare ? 'TARE NEEDED' : `${currentWeight}${targetIngredient.unit}`}
            </Text>
          </View>
          {targetIngredient && !shouldTare && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={
                progress > 1.05 ? '#FF1111' :  // Red for overweight (blue background)
                progress >= 0.95 ? '#4CAF50' : // Green for perfect
                '#2196F3'                      // Default blue for underweight
              }
              style={styles.progressBar}
            />
            
          </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: 'white',
  },
  connectContainer: {
    alignItems: "center",
    padding: 20,
  },
  connectText: {
    fontSize: 16,
    color: "white",
    marginBottom: 16,
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 16,
  },
  weightText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
  },
  unitText: {
    fontSize: 24,
    marginLeft: 8,
    color: "white",
  },
  progressContainer: {
    marginBottom: 16,
    width: screenWidth * 0.25, // 1/4 of screen width
    alignSelf: 'center',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  targetText: {
    textAlign: "right",
    marginTop: 8,
    color: "white",
  },
  error: {
    color: "#f44336",
    marginBottom: 16,
  }
});

export default ScaleReadingComponent;
