import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from "react-native-paper";
import SpeechService from "../services/SpeechService";
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import ScaleConnectButton from "./ScaleConnectButton";

const ScaleReadingComponent = ({ targetIngredient, onWeightUpdate }) => {
  const [weight, setWeight] = useState(0);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const hasSpokenRef = useRef(false);
  const targetWeight = targetIngredient?.amount || 0;

  // Reset hasSpokenRef when targetIngredient changes
  useEffect(() => {
    hasSpokenRef.current = false;
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
    // Subscribe to weight updates from ScaleServiceFactory
    const unsubscribe = ScaleServiceFactory.subscribeToWeightUpdates(handleWeightUpdate);
    return () => unsubscribe();
  }, []);

  const handleWeightUpdate = (weightData) => {
    console.log('[ScaleReadingComponent] Weight update:', weightData);
    setWeight(weightData.value);
    checkTargetWeight(weightData.value);
    
    // Call the parent's onWeightUpdate if provided
    if (onWeightUpdate) {
      onWeightUpdate(weightData);
    }
  };

  const checkTargetWeight = (currentWeight) => {
    if (currentWeight >= targetWeight && !hasSpokenRef.current) {
      SpeechService.speak('Target weight reached');
      hasSpokenRef.current = true;
    }
  };

  const progress = Math.min(weight / targetWeight, 1);

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
            <Text style={styles.weightText}>{weight}</Text>
            <Text style={styles.unitText}>{targetIngredient?.unit || "g"}</Text>
          </View>

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={progress >= 1 ? '#4CAF50' : '#2196F3'}
              style={styles.progressBar}
            />
            <Text style={styles.targetText}>
              Target: {targetWeight} {targetIngredient?.unit || 'g'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  connectContainer: {
    alignItems: "center",
    padding: 20,
  },
  connectText: {
    fontSize: 16,
    color: "#666",
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
    color: "#2196F3",
  },
  unitText: {
    fontSize: 24,
    marginLeft: 8,
    color: "#666",
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
    color: "#666",
  },
  error: {
    color: "#f44336",
    marginBottom: 16,
  }
});

export default ScaleReadingComponent;
