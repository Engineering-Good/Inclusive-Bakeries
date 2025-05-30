import { NativeEventEmitter, NativeModules } from 'react-native';

const { LefuKitchenScale } = NativeModules;

class LefuKitchenScaleClass {
  constructor() {
    this.eventEmitter = new NativeEventEmitter(LefuKitchenScale);
  }

  async initializeScale() {
    return LefuKitchenScale.initializeScale();
  }

  async startScan() {
    return LefuKitchenScale.startScan();
  }

  async stopScan() {
    return LefuKitchenScale.stopScan();
  }

  async connectToDevice(deviceId) {
    return LefuKitchenScale.connectToDevice(deviceId);
  }

  async disconnect() {
    return LefuKitchenScale.disconnect();
  }

  addWeightListener(callback) {
    return this.eventEmitter.addListener('onWeightChange', callback);
  }

  addConnectionStateListener(callback) {
    return this.eventEmitter.addListener('onConnectionStateChange', callback);
  }

  addErrorListener(callback) {
    return this.eventEmitter.addListener('onError', callback);
  }
}

export default new LefuKitchenScaleClass();