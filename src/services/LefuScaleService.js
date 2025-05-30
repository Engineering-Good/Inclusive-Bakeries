import { ScaleInterface } from './ScaleInterface';
import LefuScaleModule from '../modules/bluetooth/LefuScaleModule';

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
      await LefuScaleModule.initializeScale();
      await LefuScaleModule.startScan();
      
      // Listen for connection state changes to detect when a device is found
      this.connectionStateListener = LefuScaleModule.addConnectionStateListener((state) => {
        if (state.state === 'connected') {
          this.stopScan();
          if (onDeviceFound && this.device) {
            onDeviceFound(this.device);
          }
        }
      });

      // Listen for errors
      this.errorListener = LefuScaleModule.addErrorListener((error) => {
        console.error('Lefu scale error:', error);
      });
    } catch (error) {
      console.error('Error starting scan:', error);
      throw error;
    }
  }

  async stopScan() {
    try {
      await LefuScaleModule.stopScan();
      if (this.connectionStateListener) {
        this.connectionStateListener.remove();
      }
      if (this.errorListener) {
        this.errorListener.remove();
      }
    } catch (error) {
      console.error('Error stopping scan:', error);
      throw error;
    }
  }

  async connect(deviceId, onWeightUpdate) {
    try {
      await LefuScaleModule.connectToDevice(deviceId);
      
      // Store the device info
      this.device = {
        id: deviceId,
        name: 'Lefu Kitchen Scale' // We don't have the actual name from the native module
      };

      // Set up weight listener
      this.weightListener = LefuScaleModule.addWeightListener((data) => {
        if (onWeightUpdate) {
          onWeightUpdate({
            value: parseFloat(data.weight),
            unit: data.unit,
            isStable: data.isStable
          });
        }
      });

      return this.device;
    } catch (error) {
      console.error('Error connecting to device:', error);
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
      console.error('Error disconnecting:', error);
      throw error;
    }
  }

  async readWeight(device) {
    if (!this.device || this.device.id !== device.id) {
      throw new Error('Not connected to this device');
    }

    // For Lefu scale, we don't need to actively read the weight
    // as it's provided through notifications
    return 0;
  }
}

export default new LefuScaleService(); 