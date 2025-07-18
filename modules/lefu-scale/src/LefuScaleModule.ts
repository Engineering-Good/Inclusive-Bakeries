import { NativeModule, requireNativeModule } from "expo";
import { LefuScaleModuleEvents } from "./LefuScale.types";

declare class LefuScaleModule extends NativeModule<LefuScaleModuleEvents> {
  initializeSdk(apiKey: string, apiSecret: string): Promise<void>;
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  connectToDevice(mac: string): Promise<void>;
  disconnect(): Promise<void>;
  checkConnection(): Promise<void>;
}

export default requireNativeModule<LefuScaleModule>("LefuScale");
