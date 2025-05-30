// Reexport the native module. On web, it will be resolved to LefuScaleModule.web.js
// and on native platforms to LefuScaleModule.js
export { default } from './src/LefuScaleModule';
export { default as LefuScaleView } from './src/LefuScaleView';
