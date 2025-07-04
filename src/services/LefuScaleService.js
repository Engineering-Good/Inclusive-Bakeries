import Constants from "expo-constants";
import LefuScaleModule from "../modules/bluetooth/LefuScaleModule";
import { ScaleInterface } from "./ScaleInterface";
import React, { useRef } from "react";
import { Alert } from "react-native";

const isAlertVisible = { current: false };

class LefuScaleService extends ScaleInterface {
  constructor() {
    super();
    this.device = null;
    this.weightListener = null;
    this.connectionStateListener = null;
    this.errorListener = null;
    this.isAlertCurrentlyVisible = false;
    this.lastAlertTimestamp = 0;
    this.isActive = false;
  }

  async startScan(onDeviceFound) {
    if (this.deviceDiscoveredListener) {
      this.deviceDiscoveredListener.remove();
      this.deviceDiscoveredListener = null;
    }
    const { LEFU_API_KEY, LEFU_API_SECRET } = Constants.expoConfig?.extra ?? {};
    await LefuScaleModule.initializeScale(LEFU_API_KEY, LEFU_API_SECRET);

    this.deviceDiscoveredListener = LefuScaleModule.addDeviceDiscoveredListener(
      (device) => {
        console.log("Device found:", device);
        if (onDeviceFound) {
          onDeviceFound(device).then(() => {
            if (device.name) {
              this.device.name = device.name;
            }
          });
        }
      }
    );

    this.bleStateChangeListener = LefuScaleModule.addBleStateChangeListener(
      (event) => {
        console.log("BLE state changed:", event);
        switch (event.state) {
          case "NotFound":
            console.log("BLE state is NotFound — triggering alert.");
            this.handleNotFound();
            break;
          case "PPBleWorkSearchTimeOut":
            console.log(`Check connection, state: ${event.state}`);
            this.checkConnection();
            break;
        }
      }
    );

    await LefuScaleModule.startScan();
  }

  async stopScan() {
    await LefuScaleModule.stopScan();
    if (this.deviceDiscoveredListener) this.deviceDiscoveredListener.remove();
    if (this.bleStateChangeListener) this.bleStateChangeListener.remove();
  }

  async connect(deviceId, onWeightUpdate) {
    const { LEFU_DISCONNECT_TIMEOUT_MILLIS } =
      Constants.expoConfig?.extra ?? {};
    //cleanup previous listeners
    if (this.weightListener) {
      this.weightListener.remove();
      this.weightListener = null;
    }
    if (this.disconnectListener) {
      this.disconnectListener.remove();
      this.disconnectListener = null;
    }
    await LefuScaleModule.connectToDevice(
      deviceId,
      LEFU_DISCONNECT_TIMEOUT_MILLIS
    );
    // Store the device info
    this.device = {
      id: deviceId,
      name: "Lefu Kitchen Scale", // Default fallback name
    };

    //   Set up weight listener
    this.weightListener = LefuScaleModule.addWeightListener((data) => {
      console.log("Weight event:", data);
      if (onWeightUpdate) {
        onWeightUpdate({
          value: parseFloat(data.weight),
          unit: data.unit,
          isStable: data.isStable,
          isTare: data.isTare || false,
        });
      }
    });

    //reconnect scale if the connection has disconnected
    this.disconnectListener = LefuScaleModule.addDisconnectListener(() => {
      console.warn("Device disconnected, attempting to reconnect...");
      this.connect(this.device.id, onWeightUpdate);
    });

    return this.device;
  }

  async disconnect() {
    await LefuScaleModule.disconnect();
    this.device = null;

    if (this.weightListener) {
      this.weightListener.remove();
    }
    if (this.connectionStateListener) {
      this.connectionStateListener.remove();
    }
    if (this.errorListener) {
      this.errorListener.remove();
    }
    if (this.disconnectListener) {
      this.disconnectListener.remove();
    }
    if (this.deviceDiscoveredListener) {
      this.deviceDiscoveredListener.remove();
      this.deviceDiscoveredListener = null;
    }
    if (this.bleStateChangeListener) {
      this.bleStateChangeListener.remove();
      this.bleStateChangeListener = null;
    }
  }
  setActive(isActive) {
    this.isActive = isActive;
  }

  handleNotFound() {
    if (!this.isActive) {
      console.log("Service is not active, suppressing NotFound alert.");
      return;
    }

    const now = Date.now();
    const ALERT_COOLDOWN_MS = 10000;

    if (this.isAlertCurrentlyVisible) {
      console.log("Alert already visible, skipping.");
      return;
    }
    if (now - this.lastAlertTimestamp < ALERT_COOLDOWN_MS) {
      console.log("In cooldown period, skipping alert.");
      return;
    }

    this.isAlertCurrentlyVisible = true;
    this.lastAlertTimestamp = now;

    Alert.alert(
      "Scale Not Connected",
      "Please turn on the scale and ensure it's nearby.",
      [
        {
          text: "OK",
          onPress: () => {
            console.log("OK Pressed");
            this.isAlertCurrentlyVisible = false;
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          console.log("Alert dismissed by tapping outside.");
          this.isAlertCurrentlyVisible = false;
        },
      }
    );
  }

  async readWeight(device) {
    if (!this.device || this.device.id !== device.id) {
      throw new Error("Not connected to this device");
    }

    // For Lefu scale, we don't need to actively read the weight
    // as it's provided through notifications
    return 0;
  }

  async checkConnection() {
    try {
      await LefuScaleModule.checkConnection();
    } catch (error) {
      console.error("Error starting reconnection:", error);
      this.isReconnecting = false;
    }
  }
}

export default new LefuScaleService();
