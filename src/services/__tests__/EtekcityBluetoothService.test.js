import EtekcityBluetoothService from '../EtekcityBluetoothService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
  })),
}));

jest.mock('@utils/permissions/bluetooth', () => ({
  requestPermissions: jest.fn().mockResolvedValue(true),
}));

describe('EtekcityBluetoothService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    console.log.mockRestore();
    console.debug.mockRestore();
  });

  describe('Module loading', () => {
    it('should load without syntax errors', () => {
      expect(EtekcityBluetoothService).toBeDefined();
    });

    it('should be a singleton instance', () => {
      expect(EtekcityBluetoothService.constructor.name).not.toBe('Function');
    });
  });

  describe('constructor', () => {
    it('should initialize with disconnected status', () => {
      expect(EtekcityBluetoothService.connectionStatus).toBe('disconnected');
    });

    it('should have null device initially', () => {
      expect(EtekcityBluetoothService.device).toBeNull();
    });

    it('should have null weightCharacteristic initially', () => {
      expect(EtekcityBluetoothService.weightCharacteristic).toBeNull();
    });
  });
});
