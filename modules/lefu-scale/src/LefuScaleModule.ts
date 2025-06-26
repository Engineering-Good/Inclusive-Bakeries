import { NativeModule, requireNativeModule } from 'expo';

import { LefuScaleModuleEvents } from './LefuScale.types';

declare class LefuScaleModule extends NativeModule<LefuScaleModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LefuScaleModule>('LefuScale');
