import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';
import { ScaleInterface } from './ScaleInterface';
import { BleManager, Device } from 'react-native-ble-plx';

const ETEKCITY_SERVICE_UUID = 'FFF0';
const ETEKCITY_CHARACTERISTIC_UUID = 'FFF1';
const DEVICE_NAME = 'Etekcity Nutrition Scale';

class EtekcityScaleService extends ScaleInterface {
  constructor() {
    super();
    this.manager = Platform.OS === 'android' ? new BleManager() : null;
    this.device = null;
    this.weightCharacteristic = null;
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version, 10);
      
      // For Android 12 and above, we need to request BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      if (apiLevel >= 31) {
        const results = await Promise.all([
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
              title: 'Bluetooth Scan Permission',
              message: 'App needs Bluetooth Scan permission',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          ),
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
              title: 'Bluetooth Connect Permission',
              message: 'App needs Bluetooth Connect permission',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          ),
        ]);

        if (results.some(result => result !== PermissionsAndroid.RESULTS.GRANTED)) {
          throw new Error('Bluetooth permissions are required');
        }
      }
      
      // We still need location permission for all Android versions
      const locationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs location permission for Bluetooth scanning',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (locationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Location permission is required for Bluetooth scanning');
      }
    }
  }

  async startScan(callback) {
    if (!this.manager) {
      throw new Error('Bluetooth is not supported on this platform');
    }

    try {
      // Request permissions before starting scan
      await this.requestPermissions();

      this.manager.startDeviceScan(
        null, // null means scan for all services
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }

          // Filter for Etekcity scale devices
          if (device.name && device.name.includes('Etekcity')) {
            this.manager.stopDeviceScan();
            callback(device);
          }
        }
      );
    } catch (error) {
      console.error('Permission or scan error:', error);
      throw error;
    }
  }

  stopScan() {
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

  async connect(deviceId, onWeightUpdate) {
    if (!this.manager) {
      throw new Error('Bluetooth is not supported on this platform');
    }

    try {
      this.device = await this.manager.connectToDevice(deviceId);
      await this.device.discoverAllServicesAndCharacteristics();
      
      // Find the weight characteristic
      const services = await this.device.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          if (characteristic.properties.notify) {
            this.weightCharacteristic = characteristic;
            await this.setupWeightNotifications(onWeightUpdate);
            break;
          }
        }
      }

      return this.device;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  async setupWeightNotifications(onWeightUpdate) {
    if (!this.weightCharacteristic) {
      throw new Error('Weight characteristic not found');
    }

    await this.weightCharacteristic.monitor((error, characteristic) => {
      if (error) {
        console.error('Notification error:', error);
        return;
      }

      if (characteristic && characteristic.value) {
        // Convert the characteristic value to weight
        const weight = this.parseWeightData(characteristic.value);
        onWeightUpdate({ value: weight });
      }
    });
  }

  parseWeightData(value) {
    // Etekcity scale sends weight data in a specific format
    // This is a simplified example - adjust based on actual data format
    const buffer = Buffer.from(value, 'base64');
    return buffer.readFloatLE(0);
  }

  async disconnect() {
    if (!this.manager) {
      return;
    }

    try {
      if (this.device) {
        await this.device.cancelConnection();
        this.device = null;
        this.weightCharacteristic = null;
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  async readWeight(device) {
    if (!this.manager) {
      throw new Error('Bluetooth is not supported on this platform');
    }

    if (!this.device || this.device.id !== device.id) {
      throw new Error('Not connected to this device');
    }

    // For Etekcity scale, we don't need to actively read the weight
    // as it's provided through notifications
    return 0;
  }
}

export default new EtekcityScaleService();