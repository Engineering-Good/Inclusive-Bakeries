import type { InternalTheme } from '../../../types';
type BaseProps = {
    theme: InternalTheme;
    disabled?: boolean;
};
export declare function getTextColor({ theme, disabled }: BaseProps): string;
export declare function getIconColor({ theme, isTextInputFocused, disabled, customColor, }: BaseProps & {
    isTextInputFocused: boolean;
    customColor?: ((isTextInputFocused: boolean) => string | undefined) | string;
}): string | undefined;
export {};
//# sourceMappingURL=utils.d.ts.map