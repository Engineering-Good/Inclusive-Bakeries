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
    console.log('[EtekcityScale] Initializing service');
    this.manager = null;
    if(Platform.OS === 'android'){ 
      this.manager = new BleManager(); 
      console.log('[EtekcityScale] Created BleManager for Android');
    }
    this.device = null;
    this.weightCharacteristic = null;
  }

  async requestPermissions() {
    console.log('[EtekcityScale] Requesting permissions');
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version, 10);
      console.log(`[EtekcityScale] Android API level: ${apiLevel}`);
      
      // For Android 12 and above, we need to request BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      if (apiLevel >= 31) {
        console.log('[EtekcityScale] Requesting Android 12+ permissions');
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
      
      console.log('[EtekcityScale] Requesting location permission');
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
    console.log('[EtekcityScale] Starting device scan');
    if (!this.manager) {
      console.error('[EtekcityScale] No BLE manager available');
      throw new Error('Bluetooth is not supported on this platform');
    }

    try {
      // Request permissions before starting scan
      await this.requestPermissions();
      console.log('[EtekcityScale] Permissions granted, starting scan');

      this.manager.startDeviceScan(
        null, // null means scan for all services
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('[EtekcityScale] Scan error:', error);
            return;
          }

          if (device.name) {
            console.log(`[EtekcityScale] Found device: ${device.name} (${device.id})`);
          }

          // Filter for Etekcity scale devices
          if (device.name && device.name.includes('Etekcity')) {
            console.log('[EtekcityScale] Found Etekcity device, stopping scan');
            this.manager.stopDeviceScan();
            callback(device);
          }
        }
      );
    } catch (error) {
      console.error('[EtekcityScale] Permission or scan error:', error);
      throw error;
    }
  }

  stopScan() {
    console.log('[EtekcityScale] Stopping device scan');
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

  async connect(deviceId, onWeightUpdate) {
    console.log(`[EtekcityScale] Attempting to connect to device: ${deviceId}`);
    if (!this.manager) {
      console.error('[EtekcityScale] No BLE manager available');
      throw new Error('Bluetooth is not supported on this platform');
    }

    try {
      this.device = await this.manager.connectToDevice(deviceId);
      console.log('[EtekcityScale] Connected to device');
      
      console.log('[EtekcityScale] Discovering services and characteristics');
      await this.device.discoverAllServicesAndCharacteristics();
      
      // Get the specific service using the UUID
      const service = await this.device.services().then(services => 
        services.find(service => service.uuid.toLowerCase().includes('fff0'))
      );
      
      if (!service) {
        throw new Error('[EtekcityScale] Required service FFF0 not found');
      }
      
      // Get the specific characteristic
      this.weightCharacteristic = await service.characteristics().then(characteristics =>
        characteristics.find(char => char.uuid.toLowerCase().includes('fff1'))
      );
      
      if (!this.weightCharacteristic) {
        throw new Error('[EtekcityScale] Required characteristic FFF1 not found');
      }

      await this.setupWeightNotifications(onWeightUpdate);
      return this.device;
    } catch (error) {
      console.error('[EtekcityScale] Connection error:', error);
      throw error;
    }
  }

  async setupWeightNotifications(onWeightUpdate) {
    console.log('[EtekcityScale] Setting up weight notifications');
    if (!this.weightCharacteristic) {
      console.error('[EtekcityScale] Weight characteristic not found');
      throw new Error('Weight characteristic not found');
    }

    await this.weightCharacteristic.monitor((error, characteristic) => {
      if (error) {
        console.error('[EtekcityScale] Notification error:', error);
        return;
      }

      if (characteristic && characteristic.value) {
        // Convert the characteristic value to weight
        const weight = this.parseWeightData(characteristic.value);
        console.log(`[EtekcityScale] Received weight update: ${weight}`);
        onWeightUpdate(weight);
      }
    });
    console.log('[EtekcityScale] Weight notifications setup complete');
  }

  parseWeightData(value) {
    console.log('[EtekcityScale] Parsing weight data', value);
    const buffer = Buffer.from(value, 'base64');
   
     // Debug the buffer contents
     console.log('[EtekcityScale] Buffer length:', buffer.length);
     console.log('[EtekcityScale] Buffer contents:', Array.from(buffer).map(b => '0x' + b.toString(16)).join(' '));
  
    // Check if this is a tare command (buffer[2] === 0x64 seems to indicate tare)
    if (buffer.length === 11 && buffer[0] === 0xa5 && 
      buffer[1] === 0x02 ) {
      console.log('[EtekcityScale] Tare button pressed');
      return {
          value: 0,
          isTare: true,
          isStable: false,
          unit: 'g'  // default unit
      };
    } 

    if (buffer.length === 16) {
      // Read weight from bytes 11-12 (indices 11 and 12)
      const rawValue = buffer.readUInt16LE(11);
      
      const scaleUnitHex = buffer[13];
      const scaleStableHex = buffer[15];

      let scaleUnit;
      let scaleFactor;

      switch (scaleUnitHex) {
        case 0x02:
          scaleUnit = "g";
          scaleFactor = 10;
          break;
        case 0x00:
        case 0x01:
          scaleUnit = "oz";
          scaleFactor = 100;
          break;
        case 0x03:
          scaleUnit = "mL";
          scaleFactor = 10;
          break;
        case 0x04:
          scaleUnit = "oz fl";
          scaleFactor = 100;
          break;
        default:
          scaleUnit = "g";
          scaleFactor = 10;
          break;
      }

      const scaleValue = rawValue / scaleFactor;
      console.log(`[EtekcityScale] Parsed weight: ${scaleValue}${scaleUnit}`);
      
      return {
        value: scaleValue,
        unit: scaleUnit,
        isStable: scaleStableHex === 0x01,
        isTare: false
      };
    }
    
    console.error('[EtekcityScale] Invalid data format');
    return {
      value: 0,
      isTare: false,
      isStable: false,
      unit: 'g'
    };
  }

  async disconnect() {
    console.log('[EtekcityScale] Disconnecting from device');
    if (!this.manager) {
      return;
    }

    try {
      if (this.device) {
        await this.device.cancelConnection();
        console.log('[EtekcityScale] Successfully disconnected');
        this.device = null;
        this.weightCharacteristic = null;
      }
    } catch (error) {
      console.error('[EtekcityScale] Disconnect error:', error);
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