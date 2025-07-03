import LefuScale from "@modules/lefu-scale";

class LefuScaleModule {
  constructor() {
    this.lefuScale = LefuScale;
    console.log("LEFU_SCALE IMPORT HERE: ", this.lefuScale);
  }

  async initializeScale(key, secret) {
    return await this.lefuScale.initializeSdk(key, secret);
  }

  async startScan() {
    return this.lefuScale.startScan();
  }

  async stopScan() {
    return this.lefuScale.stopScan();
  }

  addDeviceDiscoveredListener(callback) {
    return this.lefuScale.addListener("onDeviceDiscovered", callback);
  }

  addBleStateChangeListener(callback) {
    return this.lefuScale.addListener("onBleStateChange", callback);
  }

  async connectToDevice(deviceId, disconnectTimeoutMillis) {
    return this.lefuScale.connectToDevice(deviceId, disconnectTimeoutMillis);
  }

  async disconnect() {
    return this.lefuScale.disconnect();
  }

  // async hello() {
  // 	return this.lefuScale.hello()
  // }

  // async getValueWithCallback(callback) {
  // 	return this.lefuScale.getValueWithCallback(callback)
  // }

  addWeightListener(callback) {
    return this.lefuScale.addListener("onWeightChange", callback);
  }

  addDisconnectListener(callback) {
    return this.lefuScale.addListener("hasDisconnected", callback);
  }

  // addConnectionStateListener(callback) {
  // 	return this.lefuScale.addListener('onConnectionStateChange', callback)
  // }

  // addErrorListener(callback) {
  // 	return this.lefuScale.addListener('onError', callback)
  // }
}

export default new LefuScaleModule();
