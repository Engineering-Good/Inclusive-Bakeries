import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCALE_SERVICES } from '../constants/ScaleServices';
import MockScaleService from './MockScaleService';
import EtekcityScaleService from './EtekcityBluetoothService';
import BluetoothScaleService from './BluetoothScaleService';
import EventEmitterService from './EventEmitterService';

class ScaleServiceFactory {
  static instance = null;
  static services = {
    [SCALE_SERVICES.MOCK]: null,
    [SCALE_SERVICES.ETEKCITY]: null,
    [SCALE_SERVICES.BLUETOOTH]: null
  };
  static currentDevice = null;
  static isConnected = false;

  static async getScaleService() {
    try {
      const selectedScale = await AsyncStorage.getItem('selectedScale') || SCALE_SERVICES.MOCK;
      
      // Only initialize the service if it hasn't been initialized yet
      if (!this.services[selectedScale]) {
        switch (selectedScale) {
          case SCALE_SERVICES.ETEKCITY:
            this.services[selectedScale] = EtekcityScaleService;
            break;
          case SCALE_SERVICES.BLUETOOTH:
            this.services[selectedScale] = BluetoothScaleService;
            break;
          default:
            this.services[selectedScale] = MockScaleService;
        }
      }

      return this.services[selectedScale];
    } catch (error) {
      console.error('Error getting scale service:', error);
      return MockScaleService;
    }
  }

  static async setScaleService(scaleType) {
    try {
      await AsyncStorage.setItem('selectedScale', scaleType);
      
      // Clear the service instance when changing scale type
      this.services[scaleType] = null;
      
      // Disconnect from current device if connected
      if (this.isConnected) {
        await this.disconnectFromScale();
      }
    } catch (error) {
      console.error('Error setting scale service:', error);
    }
  }

  static resetServices() {
    // Clear all service instances
    Object.keys(this.services).forEach(key => {
      this.services[key] = null;
    });
    this.currentDevice = null;
    this.isConnected = false;
  }

  static async connectToScale() {
    try {
      const scaleService = await this.getScaleService();
      
      // Don't scan if already connected
      if (this.isConnected) {
        return;
      }

      scaleService.startScan((device) => {
        console.log("Found scale:", device.name, device.id);
        scaleService.stopScan();
        this.connectToDevice(device);
      });
    } catch (error) {
      console.error("Failed to connect to scale:", error);
      throw error;
    }
  }

  static async connectToDevice(discoveredDevice) {
    try {
      const scaleService = await this.getScaleService();
      
      const connectedDevice = await scaleService.connect(
        discoveredDevice.id,
        (weightData) => {
          this.emitWeightUpdate(weightData);
        }
      );
      
      this.currentDevice = connectedDevice;
      this.isConnected = true;
      return connectedDevice;
    } catch (error) {
      console.error("Connection failed:", error);
      this.isConnected = false;
      this.currentDevice = null;
      throw error;
    }
  }

  static async disconnectFromScale() {
    try {
      const scaleService = await this.getScaleService();
      if (this.currentDevice) {
        await scaleService.disconnect();
        this.currentDevice = null;
        this.isConnected = false;
      }
    } catch (error) {
      console.error("Error disconnecting from scale:", error);
      throw error;
    }
  }

  static subscribeToWeightUpdates(callback) {
    EventEmitterService.on('weightUpdate', callback);
    return () => EventEmitterService.off('weightUpdate', callback);
  }

  static emitWeightUpdate(weightData) {
    EventEmitterService.emit('weightUpdate', weightData);
  }

  static getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      currentDevice: this.currentDevice
    };
  }
}

export default ScaleServiceFactory; 