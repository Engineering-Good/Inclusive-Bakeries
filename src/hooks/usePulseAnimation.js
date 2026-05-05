import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Custom hook to manage the weight-reached pulse animation.
 * 
 * @param {boolean} shouldAnimate - Whether the animation should be active
 * @returns {object} Animation ref and control functions
 */
const usePulseAnimation = (shouldAnimate) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);

  const startPulse = () => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    animationRef.current.start();
  };

  const stopPulse = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    scaleAnim.setValue(1);
  };

  return {
    scaleAnim,
    startPulse,
    stopPulse,
  };
};

export default usePulseAnimation;
