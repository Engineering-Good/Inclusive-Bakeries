import Constants from "expo-constants";
import LefuScaleModule from "../modules/bluetooth/LefuScaleModule";
import { ScaleInterface } from "./ScaleInterface";

class LefuScaleService extends ScaleInterface {
  constructor() {
    super();
    this.device = null;
    this.weightListener = null;
    this.connectionStateListener = null;
    this.errorListener = null;
  }

  async startScan(onDeviceFound) {
    try {
      const { LEFU_API_KEY, LEFU_API_SECRET } =
        Constants.expoConfig?.extra ?? {};
      await LefuScaleModule.initializeScale(LEFU_API_KEY, LEFU_API_SECRET);

      this.deviceDiscoveredListener =
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

      this.bleStateChangeListener = LefuScaleModule.addBleStateChangeListener(
        (state) => {
          console.log("BLE state changed:", state);
        }
      );

      await LefuScaleModule.startScan();
    } catch (error) {
      console.error("Error starting scan:", error);
      throw error;
    }
  }

  async stopScan() {
    try {
      await LefuScaleModule.stopScan();
      if (this.deviceDiscoveredListener) this.deviceDiscoveredListener.remove();
      if (this.bleStateChangeListener) this.bleStateChangeListener.remove();
    } catch (error) {
      console.error("Error stopping scan:", error);
      throw error;
    }
  }

  async connect(deviceId, onWeightUpdate) {
    try {
      await LefuScaleModule.connectToDevice(deviceId);
      // Store the device info
      this.device = {
        id: deviceId,
        name: "Lefu Kitchen Scale", // Default fallback name
      };

      // Set up weight listener
      // this.weightListener = LefuScaleModule.addWeightListener((data) => {
      // 	if (onWeightUpdate) {
      // 		onWeightUpdate({
      // 			value: parseFloat(data.weight),
      // 			unit: data.unit,
      // 			isStable: data.isStable,
      // 		})
      // 	}
      // })

      return this.device;
    } catch (error) {
      console.error("Error connecting to device:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
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
    } catch (error) {
      console.error("Error disconnecting:", error);
      throw error;
    }
  }

  async readWeight(device) {
    if (!this.device || this.device.id !== device.id) {
      throw new Error("Not connected to this device");
    }

    // For Lefu scale, we don't need to actively read the weight
    // as it's provided through notifications
    return 0;
  }
}

export default new LefuScaleService();
