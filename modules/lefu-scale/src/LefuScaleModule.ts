import { NativeModule, requireNativeModule } from 'expo';

import { LefuScaleModuleEvents } from './LefuScale.types';

declare class LefuScaleModule extends NativeModule<LefuScaleModuleEvents> {
  initializeSdk(apiKey: string, apiSecret: string): Promise<void>;
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LefuScaleModule>('LefuScale');
