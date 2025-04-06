import { registerWebModule, NativeModule } from 'expo';

class LefuScaleModule extends NativeModule {
  constructor() {
    super();
    this.PI = Math.PI;
  }

  async setValueAsync(value) {
    this.emit('onChange', { value });
  }

  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(LefuScaleModule);
