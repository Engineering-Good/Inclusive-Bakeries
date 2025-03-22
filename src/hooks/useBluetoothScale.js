import { useEffect, useState } from 'react';
import BluetoothScaleModule, { 
  BluetoothDevice, 
  addDeviceListener 
} from '../modules/bluetooth/BluetoothScaleModule';

export const useBluetoothScale = (appKey, appSecret) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        await BluetoothScaleModule.initialize(appKey, appSecret);
        setIsInitialized(true);
      } catch (e) {
        setError(e);
      }
    };
    init();

    const subscription = addDeviceListener((device) => {
      setDevices(prev => [...prev.filter(d => d.address !== device.address), device]);
    });

    return () => {
      subscription.remove();
    };
  }, [appKey, appSecret]);

  const startScanning = () => {
    setDevices([]);
    BluetoothScaleModule.startScanning();
  };

  const stopScanning = () => {
    BluetoothScaleModule.stopScanning();
  };

  const connectToDevice = async (device) => {
    try {
      await BluetoothScaleModule.connect(device.address);
      setConnectedDevice(device);
    } catch (e) {
      setError(e);
    }
  };

  const disconnect = () => {
    if (connectedDevice) {
      BluetoothScaleModule.disconnect(connectedDevice.address);
      setConnectedDevice(null);
    }
  };

  return {
    isInitialized,
    devices,
    connectedDevice,
    error,
    startScanning,
    stopScanning,
    connectToDevice,
    disconnect
  };
};
