import type { InternalTheme } from '../../types';
type BaseProps = {
    theme: InternalTheme;
    disabled?: boolean;
    type?: 'error' | 'info';
};
export declare function getTextColor({ theme, disabled, type }: BaseProps): string;
export {};
//# sourceMappingURL=utils.d.ts.map