import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { BluetoothScaleModule } = NativeModules;

if (!BluetoothScaleModule) {
  throw new Error(
    'BluetoothScaleModule is not available. Make sure you have properly linked the native module.'
  );
}

const eventEmitter = new NativeEventEmitter(BluetoothScaleModule);

export const addDeviceListener = (callback) => {
  return eventEmitter.addListener('onDeviceFound', callback);
};

// Create a wrapper to ensure all methods exist
const BluetoothScaleWrapper = {
  initialize: async (appKey, appSecret) => {
    if (!BluetoothScaleModule.initialize) {
      throw new Error('Initialize method not found in native module');
    }
    return BluetoothScaleModule.initialize(appKey, appSecret);
  },
  startScanning: () => {
    if (!BluetoothScaleModule.startScanning) {
      throw new Error('StartScanning method not found in native module');
    }
    BluetoothScaleModule.startScanning();
  },
  stopScanning: () => {
    if (!BluetoothScaleModule.stopScanning) {
      throw new Error('StopScanning method not found in native module');
    }
    BluetoothScaleModule.stopScanning();
  },
  connect: async (address) => {
    if (!BluetoothScaleModule.connect) {
      throw new Error('Connect method not found in native module');
    }
    return BluetoothScaleModule.connect(address);
  },
  disconnect: (address) => {
    if (!BluetoothScaleModule.disconnect) {
      throw new Error('Disconnect method not found in native module');
    }
    BluetoothScaleModule.disconnect(address);
  }
};

export default BluetoothScaleWrapper;