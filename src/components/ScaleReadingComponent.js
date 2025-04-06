import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from "react-native-paper";
import SpeechService from "../services/SpeechService";
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import ScaleConnectButton from "./ScaleConnectButton";

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
  const hasSpokenRef = useRef(false);
  const targetWeight = targetIngredient?.amount || 0;

  // Reset states when ingredient changes
  useEffect(() => {
    hasSpokenRef.current = false;
    setIsTared(false);
    setCurrentWeight(0);
  }, [targetIngredient]);

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
    const checkTargetWeight = (currentWeight) => {
      if (currentWeight >= targetWeight && !hasSpokenRef.current) {
        SpeechService.speak('Target weight reached');
        hasSpokenRef.current = true;
      }
    };

    const handleWeightUpdate = (weightData) => {
      console.log('[ScaleReadingComponent] Weight update:', weightData);
      
      // Handle tare event
      if (weightData.isTare) {
        console.log('[ScaleReadingComponent] Tare detected');
        setIsTared(true);
        return;
      }
  
      console.log('[ScaleReadingComponent] Tare:', requireTare, 'Is Tared:', isTared);
      
      if (!requireTare || isTared) {
        console.log('[ScaleReadingComponent] Processing weight after tare check');
        setCurrentWeight(weightData.value);
        checkTargetWeight(weightData.value);
        
        const newProgress = Math.min(weightData.value / targetIngredient?.amount || 0, 1);
        onProgressUpdate(newProgress);
      }
  
      onWeightData?.(weightData);
    };
  
    // Subscribe to weight updates
    const unsubscribe = ScaleServiceFactory.subscribeToWeightUpdates(handleWeightUpdate);
    return () => unsubscribe();
  }, [isTared, requireTare, targetIngredient, onProgressUpdate, onWeightData]);


  // useEffect(() => {
  //   // Subscribe to weight updates from ScaleServiceFactory
  //   const unsubscribe = ScaleServiceFactory.subscribeToWeightUpdates(handleWeightUpdate);
  //   return () => unsubscribe();
  // }, []);

  // const handleWeightUpdate = (weightData) => {
  //   console.log('[ScaleReadingComponent] Weight update:', weightData);
    
  //   // Handle tare event
  //   if (weightData.isTare) {
  //     console.log('[ScaleReadingComponent] Tare detected');
  //     setIsTared(true);
  //     // Don't process weight on tare event
  //     return;
  //   }
  //   console.log('[ScaleReadingComponent] Tare:', requireTare, 'Is Tared:', isTared);
  //   // Process weight only if already tared or tare not required
  //   if (!requireTare || isTared) {
  //     console.log('[ScaleReadingComponent] Processing weight after tare check');
  //     setCurrentWeight(weightData.value);
  //     checkTargetWeight(weightData.value);
      
  //     const newProgress = Math.min(weightData.value / targetIngredient.amount, 1);
  //     console.log('[ScaleReadingComponent] Progress callback:', newProgress);
  //     onProgressUpdate(newProgress);
  //   }

  //   // Always pass weight data to parent
  //   onWeightData?.(weightData);
  // };



  const progress = (!requireTare || isTared) ? Math.min(currentWeight / targetWeight, 1) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scale Reading</Text>

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
              {(requireTare && !isTared) ? 'TARE NEEDED' : `${currentWeight}${targetIngredient.unit}`}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={progress >= 1 ? '#4CAF50' : '#2196F3'}
              style={styles.progressBar}
            />
            
          </View>
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
