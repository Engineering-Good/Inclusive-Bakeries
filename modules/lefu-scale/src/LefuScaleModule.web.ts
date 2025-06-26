import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './LefuScale.types';

type LefuScaleModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class LefuScaleModule extends NativeModule<LefuScaleModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(LefuScaleModule, 'LefuScaleModule');
