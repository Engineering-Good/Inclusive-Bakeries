import { ScaleInterface } from './ScaleInterface';

class MockScaleService extends ScaleInterface {
  constructor() {
    super();
    this.isScanning = false;
    this.connectedDevice = null;
    this.weightUpdateInterval = null;
    this.currentWeight = 0;
    this.deviceId = '';
  }

  startScan(onDeviceFound) {
    if (this.isScanning) return;
    
    this.isScanning = true;
    console.log('Mock scale: Starting scan...');
    
    // Simulate finding a device after 1 second
    setTimeout(() => {
      const mockDevice = {
        id: 'mock-device-1',
        name: 'Mock Scale',
        rssi: -50
      };
      onDeviceFound(mockDevice);
      this.stopScan();
    }, 1000);
  }

  stopScan() {
    this.isScanning = false;
    console.log('Mock scale: Stopping scan...');
  }

  async connect(deviceId, onWeightUpdate) {
    if (this.connectedDevice) {
      throw new Error('Already connected to a device');
    }

    console.log('Mock scale: Connecting to device:', deviceId);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.connectedDevice = {
      id: deviceId,
      name: 'Mock Scale',
    };
    this.deviceId = deviceId;
    // Start sending random weight updates
    this.startWeightUpdates(onWeightUpdate);

    return this.connectedDevice;
  }

  startWeightUpdates(onWeightUpdate) {
    // Send weight updates every second
    this.weightUpdateInterval = setInterval(() => {
      // Increase weight by 10-50g each update
      this.currentWeight += Math.floor(Math.random() * 40) + 10;
      // Cap at 1000g
      this.currentWeight = Math.min(this.currentWeight, 500);
      
      onWeightUpdate({
        value: this.currentWeight,
        unit: 'g',
        stable: true,
        timestamp: new Date().getTime()
      });
    }, 1000);
  }

  async disconnect() {

    
    if (this.weightUpdateInterval) {
      clearInterval(this.weightUpdateInterval);
      this.weightUpdateInterval = null;
    }

    this.connectedDevice = null;
    this.currentWeight = 0;
  }

  async readWeight(device) {
    if (!this.connectedDevice || this.connectedDevice.id !== device.id) {
      throw new Error('Not connected to this device');
    }

    // Return a random weight between 0-1000g
    return Math.floor(Math.random() * 1000);
  }
}

export default new MockScaleService(); 