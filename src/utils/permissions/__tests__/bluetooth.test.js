import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  showPermissionSettingsAlert,
  requestPermissions,
} from '../bluetooth';

// Mock React Native modules
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openSettings: jest.fn(),
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
      BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
    request: jest.fn(),
  },
  Platform: {
    OS: 'android',
    Version: 31,
  },
}));

describe('Bluetooth Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showPermissionSettingsAlert', () => {
    it('should display alert with correct title and message', () => {
      const permissionTitle = 'Bluetooth Scan';

      showPermissionSettingsAlert(permissionTitle);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Bluetooth Scan Needed',
        'To use this feature, please enable bluetooth scan in your device settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: expect.any(Function),
          },
        ],
        { cancelable: true }
      );
    });

    it('should call Linking.openSettings when Open Settings is pressed', () => {
      const permissionTitle = 'Location';

      showPermissionSettingsAlert(permissionTitle);

      const alertCall = Alert.alert.mock.calls[0];
      const openSettingsButton = alertCall[2][1]; // Second button is "Open Settings"

      openSettingsButton.onPress();

      expect(Linking.openSettings).toHaveBeenCalled();
    });
  });

  describe('requestPermissions', () => {
    it('should do nothing on non-Android platforms', async () => {
      Platform.OS = 'ios';

      await requestPermissions();

      expect(PermissionsAndroid.request).not.toHaveBeenCalled();

      Platform.OS = 'android'; // Reset for other tests
    });

    it('should request Bluetooth permissions on Android 12+ (API 31+)', async () => {
      Platform.Version = 31;
      PermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

      await requestPermissions();

      expect(PermissionsAndroid.request).toHaveBeenCalledTimes(3); // SCAN, CONNECT, LOCATION
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        expect.objectContaining({
          title: 'Bluetooth Scan Permission',
          message: 'App needs permission to scan for nearby Bluetooth devices.',
        })
      );
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        expect.objectContaining({
          title: 'Bluetooth Connect Permission',
          message: 'App needs permission to connect to Bluetooth devices.',
        })
      );
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        expect.objectContaining({
          title: 'Location Permission',
          message: 'Location access is required to scan for Bluetooth devices.',
        })
      );
    });

    it('should only request location permission on Android < 12 (API < 31)', async () => {
      Platform.Version = 30;
      PermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

      await requestPermissions();

      expect(PermissionsAndroid.request).toHaveBeenCalledTimes(1); // Only LOCATION
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        expect.objectContaining({
          title: 'Location Permission',
        })
      );
    });

    it('should show settings alert when permission is NEVER_ASK_AGAIN', async () => {
      Platform.Version = 31;
      PermissionsAndroid.request
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) // SCAN
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED) // CONNECT
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED); // LOCATION

      await requestPermissions();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Bluetooth Scan Permission Needed',
        'To use this feature, please enable bluetooth scan permission in your device settings.',
        expect.any(Array),
        { cancelable: true }
      );
    });

    it('should retry permission request when initially denied', async () => {
      Platform.Version = 31;
      PermissionsAndroid.request
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED) // First attempt fails
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED) // Retry succeeds
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED) // CONNECT
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED); // LOCATION

      await requestPermissions();

      expect(PermissionsAndroid.request).toHaveBeenCalledTimes(4); // SCAN (twice), CONNECT, LOCATION
    });

    it('should throw error when permission is denied after retry', async () => {
      Platform.Version = 31;
      PermissionsAndroid.request
        .mockResolvedValue(PermissionsAndroid.RESULTS.DENIED); // All attempts fail

      await expect(requestPermissions()).rejects.toThrow('Bluetooth Scan Permission is required.');
    });

    it('should handle multiple permission failures', async () => {
      Platform.Version = 31;
      PermissionsAndroid.request
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED) // SCAN first attempt
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED) // SCAN retry - fails
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED) // CONNECT
        .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED); // LOCATION

      await expect(requestPermissions()).rejects.toThrow('Bluetooth Scan Permission is required.');
    });
  });
});