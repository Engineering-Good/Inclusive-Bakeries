import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { ProgressBar, Button } from "react-native-paper"; // Import Button from react-native-paper
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import EventEmitterService from "../services/EventEmitterService"; // Import EventEmitterService
import SpeechService from '../services/SpeechService';
import { SCALE_MESSAGES } from "../constants/speechText";
import useWeighingLogic from "../hooks/useWeighingLogic";

// Add at the top of the file, after imports
const screenWidth = Dimensions.get("window").width;

const ScaleDisplayComponent = ({
  targetIngredient,
  currentWeight,
  onWeightChange,
  onTare,
  requireTare,
  isWeighableOnly = false,
  onTareStatusChange,
}) => {
  const [error, setError] = useState(null);
  // Use a more descriptive connection status
  const [connectionStatus, setConnectionStatus] = useState("idle"); // 'idle', 'connecting', 'connected', 'reconnectionFailed', 'connectionFailed'
  const [tareStatus, setTareStatus] = useState(
    requireTare ? "pending" : "not_required"
  );
  const hasSpokenRef = useRef(false);
  const [, forceUpdate] = useState({});
  const {
    targetWeight,
    tolerance,
    isWithinTolerance,
    isOverTolerance,
    progress,
  } = useWeighingLogic(targetIngredient, currentWeight);

  const handleConnectPress = useCallback(async () => {
    setError(null);
    setConnectionStatus("connecting");
    try {
      await ScaleServiceFactory.connectToScale();
      // Status will be updated by the EventEmitterService subscription
    } catch (err) {
      // Error handling is now primarily done via EventEmitterService subscription
      // but this catch block can be used for immediate feedback if needed
      console.error(
        "[ScaleDisplayComponent] Error during connectToScale:",
        err
      );
    }
  }, []);

  const handleDisconnectPress = useCallback(async () => {
    try {
      await ScaleServiceFactory.disconnectFromScale();
      // Status will be updated by the EventEmitterService subscription
    } catch (err) {
      console.error(
        "[ScaleDisplayComponent] Error during disconnectFromScale:",
        err
      );
      setError("Failed to disconnect from scale.");
    }
  }, []);

  // Derived state for convenience
  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";
  const isReconnectionFailed = connectionStatus === "reconnectionFailed";
  const isConnectionFailed = connectionStatus === "connectionFailed";

  // Reset states when ingredient changes
  useEffect(() => {
    hasSpokenRef.current = false;
    setTareStatus(requireTare ? "pending" : "not_required");
    onWeightChange(0, false); // Reset weight in parent
  }, [targetIngredient, requireTare]);

  // Notify parent of tare status change
  useEffect(() => {
    if (onTareStatusChange) {
      onTareStatusChange(tareStatus);
    }
  }, [tareStatus, onTareStatusChange]);

  // Combined useEffect for subscriptions and cleanup
  useEffect(() => {
    const handleConnectionStatusChange = (status) => {
      setConnectionStatus(status);
      if (status === "connected") {
        setError(null);
      } else if (
        status === "reconnectionFailed" ||
        status === "connectionFailed"
      ) {
        setError(
          "Failed to connect to scale. Please ensure it is on and within range, or try resetting it."
        );
      }
    };

    const handleWeightUpdate = (weightData) => {
      if (weightData.isTare) {
        setTareStatus("tared");
        onTare();
      }

      if (
        tareStatus === "pending" &&
        weightData.value > 0 &&
        (!hasSpokenRef.current || hasSpokenRef.current !== "tare")
      ) {
        SpeechService.speak(SCALE_MESSAGES.TARE_NEEDED);
        hasSpokenRef.current = "tare";
      }
    };

    const unsubscribeConnection = EventEmitterService.on(
      "connectionStatus",
      handleConnectionStatusChange
    );
    const unsubscribeWeight =
      ScaleServiceFactory.subscribeToWeightUpdates(handleWeightUpdate);

    const initialStatus = ScaleServiceFactory.getConnectionStatus();
    if (initialStatus.isConnected) {
      setConnectionStatus("connected");
    } else {
      handleConnectPress();
    }

    return () => {
      unsubscribeConnection();
      unsubscribeWeight();
      hasSpokenRef.current = false;
      SpeechService.stop();
    };
  }, [
    targetIngredient,
    requireTare,
    onTare,
    handleConnectPress,
    tareStatus,
  ]);

  const displayProgress = (tareStatus === 'tared' || tareStatus === 'not_required') ? progress : 0;

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      {!isConnected ? (
        <View style={styles.connectContainer}>
          {isConnecting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" style={styles.spinner} />
              <Text style={styles.connectText}>
                Attempting to connect to scale...
              </Text>
            </View>
          )}
          {(isReconnectionFailed ||
            isConnectionFailed ||
            connectionStatus === "idle") && (
            <>
              <Text style={styles.connectText}>Scale not connected</Text>
              <Button
                mode="contained"
                onPress={handleConnectPress}
                buttonColor={"#2196F3"}
                style={styles.button}
                disabled={isConnecting}
              >
                Connect to Scale
              </Button>
            </>
          )}
        </View>
      ) : (
        <>
          {isWeighableOnly ? (
            // For unit-based ingredients, show simple status instead of weight
            <View style={styles.weightContainer}>
              <Text style={styles.weightText}>
                {currentWeight > 1 ? "Ready!" : "Place item on scale"}
              </Text>
            </View>
          ) : (
            // For weight-based ingredients, show normal weight display
            <>
              <View style={styles.weightContainer}>
                <Text style={styles.weightText}>
                  {targetIngredient && tareStatus === "pending"
                    ? "Press TARE Button"
                    : `${Number(currentWeight).toFixed(1)}${targetIngredient.unit}`}
                </Text>
              </View>
              {targetIngredient && (tareStatus === 'tared' || tareStatus === 'not_required') && (
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={displayProgress}
                  color={
                    isOverTolerance ? '#FF1111' :  // Red for over tolerance
                    isWithinTolerance ? '#4CAF50' : // Green for within tolerance
                    '#2196F3'                                      // Blue for under
                  }
                  style={styles.progressBar}
                />
                <Text style={styles.targetText}>
                  Target: {targetWeight}{targetIngredient.unit} ± {tolerance}{targetIngredient.unit}
                </Text>
              </View>
              )}
            </>
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
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 16,
    color: "white",
  },
  connectContainer: {
    alignItems: "center",
    padding: 20,
  },
  connectText: {
    fontSize: 16,
    color: "white",
    marginBottom: 16,
    textAlign: "center",
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 16,
  },
  weightText: {
    fontSize: 64,
    fontWeight: "bold",
    color: "white",
  },
  unitText: {
    fontSize: 36,
    marginLeft: 8,
    color: "white",
  },
  progressContainer: {
    marginBottom: 16,
    width: screenWidth * 0.25, // 1/4 of screen width
    alignSelf: "center",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  targetText: {
    textAlign: "center",
    marginTop: 8,
    color: "white",
    fontSize: 16,
  },
  error: {
    color: "#f44336",
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    width: "80%",
    alignSelf: "center",
    marginTop: 10,
  },
  loadingContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 10,
  },
});

export default ScaleDisplayComponent;
