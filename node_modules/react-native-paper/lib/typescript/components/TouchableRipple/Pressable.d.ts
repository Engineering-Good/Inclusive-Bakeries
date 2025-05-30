import type * as React from 'react';
import type { Animated, PressableProps as PressableNativeProps, StyleProp, View, ViewStyle } from 'react-native';
export type PressableStateCallbackType = {
    hovered: boolean;
    pressed: boolean;
    focused: boolean;
};
export type PressableProps = Omit<PressableNativeProps, 'children' | 'style'> & {
    children: React.ReactNode | ((state: PressableStateCallbackType) => React.ReactNode) | undefined;
    style?: StyleProp<ViewStyle> | Animated.WithAnimatedValue<StyleProp<ViewStyle>> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle> | Animated.WithAnimatedValue<StyleProp<ViewStyle>>) | undefined;
};
export declare const Pressable: React.ForwardRefExoticComponent<PressableProps & React.RefAttributes<View>>;
//# sourceMappingURL=Pressable.d.ts.map