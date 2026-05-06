import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');
// Use the short side so values stay stable regardless of orientation
export const SHORT_SIDE = Math.min(width, height);

// Scale a dp value proportionally to the screen's short side.
// 600dp is the approximate short side of the target 10" tablets; the ratio
// is what matters — the baseline itself cancels out in the calculation.
export const scale = (size) =>
  Math.round(PixelRatio.roundToNearestPixel((SHORT_SIDE / 600) * size));

// Android Picker height: ~8.3 % of the short side, never below 50dp.
// (50 / 600 ≈ 0.083; higher-DPI devices have a larger SHORT_SIDE in dp,
// so the picker grows to accommodate the native spinner widget.)
export const PICKER_HEIGHT = Math.max(50, Math.round(SHORT_SIDE * 0.083));

// Horizontal padding that prevents bold glyph right-side-bearing from being
// clipped on Android at high pixel densities. 20 % of the font size gives
// sufficient clearance for any weight/style combination.
export const glyphPadding = (scaledFontSize) => Math.ceil(scaledFontSize * 0.2);
