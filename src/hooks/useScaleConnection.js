import { useState, useEffect, useCallback, useRef } from 'react';
import ScaleServiceFactory from '../services/ScaleServiceFactory';

/**
 * Custom hook to manage scale device communication.
 * Handles connection lifecycle, weight updates, and connection status.
 * 
 * @param {boolean} requireScale - Whether the current step requires a scale
 * @returns {object} Scale state and control functions
 */
const useScaleConnection = (requireScale = true) => {
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMockScaleActive, setIsMockScaleActive] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const weightUpdateRef = useRef(null);
  const lastStableWeightRef = useRef(0);
  const subscriptionRef = useRef(null);

  // Debounce weight updates to avoid jitter
  const handleWeightUpdate = useCallback((weightData) => {
    try {
      console.log('[useScaleConnection] handleWeightUpdate called with:', weightData)
      const weight = typeof weightData === 'number' ? weightData : weightData.value;
      const isStableReading = weightData.isStable !== undefined ? weightData.isStable : true;
      console.log('[useScaleConnection] weight:', weight, 'isStableReading:', isStableReading)

      // Clear previous debounced update
      if (weightUpdateRef.current) {
        clearTimeout(weightUpdateRef.current);
      }

      // Only process significant changes (>0.5g threshold)
      const shouldProcess = Math.abs(weight - lastStableWeightRef.current) > 0.5;

      console.log('[useScaleConnection] shouldProcess:', shouldProcess, 'weight:', weight, 'lastStable:', lastStableWeightRef.current)

      if (!shouldProcess && !isStableReading) return;

      if (isStableReading) {
        // Immediate update for stable readings
        console.log('[useScaleConnection] setting currentWeight to:', weight)
        setCurrentWeight(weight);
        setIsStable(isStableReading);
        lastStableWeightRef.current = weight;
      } else {
        // Debounce for unstable readings
        weightUpdateRef.current = setTimeout(() => {
          console.log('[useScaleConnection] setting currentWeight to:', weight)
          setCurrentWeight(weight);
          setIsStable(isStableReading);
          lastStableWeightRef.current = weight;
        }, 300);
      }
    } catch (error) {
      console.error('Error in handleWeightUpdate:', error)
    }
  }, []);

  // Initialize scale connection and subscription
  useEffect(() => {
    let isActive = true;
    let scaleService = null;
    let unsubscribe = null;

    const initializeScale = async () => {
      try {
        setConnectionError(null);
        scaleService = await ScaleServiceFactory.getScaleService();
        
        if (!isActive) return;

        // Set scale active based on whether ingredient requires it
        if (scaleService.setActive) {
          scaleService.setActive(requireScale);
        }

        // Check mock scale status
        const mockActive = await ScaleServiceFactory.isMockScaleSelected();
        if (isActive) {
          setIsMockScaleActive(mockActive);
        }

        // Subscribe to weight updates via the factory's event emitter
        unsubscribe = ScaleServiceFactory.subscribeToWeightUpdates(handleWeightUpdate);
        subscriptionRef.current = unsubscribe;
        console.log('[useScaleConnection] Subscribed to weight updates, unsubscribe:', typeof unsubscribe)

        // Update connection status
        const checkConnection = async () => {
          if (!isActive) return;
          const status = ScaleServiceFactory.getConnectionStatus();
          setIsConnected(status.isConnected || mockActive);
        };
        checkConnection();
      } catch (error) {
        console.error('[useScaleConnection] Failed to initialize scale:', error);
        if (isActive) {
          setIsConnected(false);
          setConnectionError('Failed to connect to scale. Please ensure it is on and within range.');
        }
      }
    };

    initializeScale();

    // Return cleanup function
    return () => {
      console.log('[useScaleConnection] Cleanup running')
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      if (scaleService && scaleService.setActive) {
        scaleService.setActive(false);
      }
      if (weightUpdateRef.current) {
        clearTimeout(weightUpdateRef.current);
        weightUpdateRef.current = null;
      }
    };
  }, [requireScale, handleWeightUpdate]);

  // Reset function to clear state
  const reset = useCallback(() => {
    setCurrentWeight(0);
    setIsStable(false);
    lastStableWeightRef.current = 0;
    if (weightUpdateRef.current) {
      clearTimeout(weightUpdateRef.current);
      weightUpdateRef.current = null;
    }
  }, []);

  return {
    currentWeight,
    isStable,
    isConnected,
    isMockScaleActive,
    connectionError,
    reset,
  };
};

export default useScaleConnection;
