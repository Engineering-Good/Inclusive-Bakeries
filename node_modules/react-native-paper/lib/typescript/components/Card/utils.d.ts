import type { ViewStyle } from 'react-native';
import type { InternalTheme } from '../../types';
type CardMode = 'elevated' | 'outlined' | 'contained';
type BorderRadiusStyles = Pick<ViewStyle, Extract<keyof ViewStyle, `border${string}Radius`>>;
export declare const getCardCoverStyle: ({ theme, index, total, borderRadiusStyles, }: {
    theme: InternalTheme;
    borderRadiusStyles: BorderRadiusStyles;
    index?: number | undefined;
    total?: number | undefined;
}) => {
    borderBottomEndRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderBottomStartRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderEndEndRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderEndStartRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderStartEndRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderStartStartRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderTopEndRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderTopStartRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderRadius: string | import("react-native").AnimatableNumericValue;
    borderTopLeftRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderTopRightRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderBottomLeftRadius?: string | import("react-native").AnimatableNumericValue | undefined;
    borderBottomRightRadius?: string | import("react-native").AnimatableNumericValue | undefined;
} | {
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
    borderBottomLeftRadius?: undefined;
} | {
    borderBottomLeftRadius: number;
    borderTopLeftRadius?: undefined;
    borderTopRightRadius?: undefined;
} | undefined;
export declare const getCardColors: ({ theme, mode, }: {
    theme: InternalTheme;
    mode: CardMode;
}) => {
    backgroundColor: string | undefined;
    borderColor: string;
};
export {};
//# sourceMappingURL=utils.d.ts.map