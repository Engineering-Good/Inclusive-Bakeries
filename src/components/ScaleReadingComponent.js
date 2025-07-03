import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { ProgressBar, Button } from "react-native-paper"; // Import Button from react-native-paper
import SpeechService from "../services/SpeechService";
import ScaleServiceFactory from "../services/ScaleServiceFactory";
import EventEmitterService from "../services/EventEmitterService"; // Import EventEmitterService
import { SCALE_MESSAGES } from "../constants/speechText";

// Add at the top of the file, after imports
const screenWidth = Dimensions.get("window").width;

const ScaleReadingComponent = ({
  targetIngredient,
  onProgressUpdate,
  onWeightData,
  requireTare,
}) => {
  const [currentWeight, setCurrentWeight] = useState(0);
  const [error, setError] = useState(null);
  // Use a more descriptive connection status
  const [connectionStatus, setConnectionStatus] = useState("idle"); // 'idle', 'connecting', 'connected', 'reconnectionFailed', 'connectionFailed'
  const [tareStatus, setTareStatus] = useState(
    requireTare ? "pending" : "not_required"
  );
  const hasSpokenRef = useRef(false);
  const targetWeight = targetIngredient?.amount || 0;
  const [, forceUpdate] = useState({});

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
        "[ScaleReadingComponent] Error during connectToScale:",
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
        "[ScaleReadingComponent] Error during disconnectFromScale:",
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
    setCurrentWeight(0);
  }, [targetIngredient, requireTare]);

  // Combined useEffect for subscriptions and cleanup
  useEffect(() => {
    const handleConnectionStatusChange = (status) => {
      setConnectionStatus(status);
      if (status === "connected") {
        setError(null); // Clear any previous errors on successful connection
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
      if (!targetIngredient) {
        return;
      }
      // Handle tare event
      if (weightData.isTare) {
        setTareStatus("tared");
        return;
      }

      // Announce tare needed if there's weight and tareStatus is pending
      if (
        tareStatus === "pending" &&
        weightData.value > 0 &&
        (!hasSpokenRef.current || hasSpokenRef.current !== "tare")
      ) {
        console.log("[ScaleReadingComponent] Attempting to speak TARE_NEEDED."); // Added log
        SpeechService.speak(SCALE_MESSAGES.TARE_NEEDED);
        hasSpokenRef.current = "tare";
        return;
      }

      if (tareStatus === "tared" || tareStatus === "not_required") {
        console.log(
          "[ScaleReadingComponent] Setting currentWeight to:",
          weightData.value
        ); // Added log
        setCurrentWeight(weightData.value);

        const newProgress = weightData.value / targetIngredient?.amount || 0;
        const isStable = weightData.isStable;
        onProgressUpdate(newProgress, isStable);
      }

      onWeightData?.(weightData);
      forceUpdate({});
    };

    // Subscribe to connection status updates
    const unsubscribeConnection = EventEmitterService.on(
      "connectionStatus",
      handleConnectionStatusChange
    );
    // Subscribe to weight updates
    const unsubscribeWeight =
      ScaleServiceFactory.subscribeToWeightUpdates(handleWeightUpdate);

    // Initial check for connection status
    const initialStatus = ScaleServiceFactory.getConnectionStatus();
    if (initialStatus.isConnected) {
      setConnectionStatus("connected");
    } else {
      // Attempt to connect when component mounts if not already connected
      handleConnectPress();
    }

    return () => {
      // Cleanup all subscriptions on component unmount
      unsubscribeConnection();
      unsubscribeWeight();
      ScaleServiceFactory.unsubscribeAll(); // Ensure all listeners are removed from ScaleServiceFactory
      // setCurrentWeight(0); // Removed this line
      hasSpokenRef.current = false;
      SpeechService.stop();
    };
  }, [
    targetIngredient,
    requireTare,
    onProgressUpdate,
    onWeightData,
    handleConnectPress,
    tareStatus,
  ]);

  const progress =
    tareStatus === "tared" || tareStatus === "not_required"
      ? currentWeight / targetWeight
      : 0;

  console.log(
    "[ScaleReadingComponent] Render. currentWeight:",
    currentWeight,
    "tareStatus:",
    tareStatus
  ); // Added log

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
          <View style={styles.weightContainer}>
            <Text style={styles.weightText}>
              {targetIngredient && tareStatus === "pending"
                ? "Press TARE Button"
                : `${currentWeight}${targetIngredient.unit}`}
            </Text>
          </View>
          {targetIngredient &&
            (tareStatus === "tared" || tareStatus === "not_required") && (
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={progress}
                  color={
                    progress > 1.05
                      ? "#FF1111" // Red for overweight (blue background)
                      : progress >= 0.95
                      ? "#4CAF50" // Green for perfect
                      : "#2196F3" // Default blue for underweight
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
    textAlign: "right",
    marginTop: 8,
    color: "white",
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

export default ScaleReadingComponent;
