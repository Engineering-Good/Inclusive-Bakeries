import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScaleServiceFactory from '../services/ScaleServiceFactory';

const useScale = (requireScale) => {
  const [isMockScaleActive, setIsMockScaleActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function activateService() {
        const scaleService = await ScaleServiceFactory.getScaleService();
        if (active && scaleService.setActive) {
          scaleService.setActive(requireScale);
        }
      }

      activateService();

      const interval = setInterval(() => {
        ScaleServiceFactory.checkConnection();
      }, 31000);

      return () => {
        active = false;
        console.log("Cleaning up scale connection check...");
        ScaleServiceFactory.getScaleService().then((service) => {
          if (service.setActive) {
            service.setActive(false);
          }
        });
        clearInterval(interval);
      };
    }, [requireScale])
  );

  useEffect(() => {
    const checkMockScaleStatus = async () => {
      const mockActive = await ScaleServiceFactory.isMockScaleSelected();
      setIsMockScaleActive(mockActive);
    };

    checkMockScaleStatus();
  }, []);

  return { isMockScaleActive };
};

export default useScale;
