// Reexport the native module. On web, it will be resolved to LefuScaleModule.web.ts
// and on native platforms to LefuScaleModule.ts
export { default } from './src/LefuScaleModule';
export { default as LefuScaleView } from './src/LefuScaleView';
export * from  './src/LefuScale.types';
