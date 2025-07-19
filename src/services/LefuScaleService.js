import Constants from "expo-constants";
import LefuScaleModule, {
  LefuScaleEvents,
} from "../modules/bluetooth/LefuScaleModule";
import { requestPermissions } from '@utils/permissions/bluetooth'
import { ScaleInterface } from './ScaleInterface'
import React, { useRef } from 'react'
import { Alert } from 'react-native'

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
    const { LEFU_API_KEY, LEFU_API_SECRET } = Constants.expoConfig?.extra ?? {};
    await LefuScaleModule.initializeScale(LEFU_API_KEY, LEFU_API_SECRET);
    LefuScaleModule.removeAllListener();

    LefuScaleModule.addDeviceDiscoveredListener((device) => {
      console.log("Device found:", device);
      if (onDeviceFound) {
        onDeviceFound(device).then(() => {
          if (device.name) {
            this.device.name = device.name;
          }
        });
      }
    });

    return await new Promise((resolve, reject) => {
      LefuScaleModule.addBleStateChangeListener((event) => {
		switch (event.state) {
          case "NotFound":
            console.log("BLE state is NotFound — triggering alert.");
            this.handleNotFound();
            break;
          case "PPBleWorkSearchTimeOut":
            console.log(`Check connection, state: ${event.state}`);
			if (this.device !== null) {
            	this.checkConnection();
			}
            break;
        }
		resolve()
      });

      LefuScaleModule.startScan();
    });
  }

  async stopScan() {
    await LefuScaleModule.stopScan();
    LefuScaleModule.removeListener([
      LefuScaleEvents.ON_DEVICE_DISCOVERED
    ]);
  }

  async connect(deviceId, onWeightUpdate) {
    await LefuScaleModule.connectToDevice(deviceId);
    // Store the device info
    this.device = {
      id: deviceId,
      name: "Lefu Kitchen Scale", // Default fallback name
    };

    //   Set up weight listener
    LefuScaleModule.addWeightListener((data) => {
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
    LefuScaleModule.addDisconnectListener(() => {
      console.warn("Device disconnected, attempting to reconnect...");
      this.connect(this.device.id, onWeightUpdate);
    });

    return this.device;
  }

  async disconnect() {
    await LefuScaleModule.disconnect();
    LefuScaleModule.removeAllListener();
    this.device = null;
  }

  async readWeight(device) {
    if (!this.device || this.device.id !== device.id) {
      throw new Error("Not connected to this device");
    }

    // For Lefu scale, we don't need to actively read the weight
    // as it's provided through notifications
    return 0;
  }

	async setActive(isActive) {
		this.isActive = isActive
		if (isActive) {
			try {
				await requestPermissions()
				// After permissions are granted, you might want to initiate a scan or connection
			} catch (error) {
				console.error('Permission error in LefuScaleService:', error)
				// Handle permission denial
			}
		} else {
			// Optional: handle deactivation, e.g., by disconnecting
			if (this.device) {
				await this.disconnect()
			}
		}
	}

  handleNotFound() {
    if (!this.isActive) {
      console.log("Service is not active. No NotFound alert.");
      return;
    }

    const now = Date.now();
    const ALERT_COOLDOWN_MS = 10000;

    if (this.isAlertCurrentlyVisible) {
      return;
    }
    if (now - this.lastAlertTimestamp < ALERT_COOLDOWN_MS) {
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
            this.isAlertCurrentlyVisible = false;
		  	this.checkConnection();
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          this.isAlertCurrentlyVisible = false;
		  this.checkConnection();
        },
      }
    );
  }

  checkConnection() {
    try {
      LefuScaleModule.checkConnection();
    } catch (error) {
      console.error("Error starting reconnection:", error);
      this.isReconnecting = false;
    }
  }
}

export default new LefuScaleService();
