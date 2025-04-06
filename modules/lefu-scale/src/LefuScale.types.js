// Note: This file now only contains JSDoc comments for type documentation
/**
 * @typedef {Object} OnLoadEventPayload
 * @property {string} url
 */

/**
 * @typedef {Object} ChangeEventPayload
 * @property {string} value
 */

/**
 * @typedef {Object} LefuScaleModuleEvents
 * @property {function(ChangeEventPayload): void} onChange
 */

/**
 * @typedef {Object} LefuScaleViewProps
 * @property {string} url
 * @property {function({ nativeEvent: OnLoadEventPayload }): void} onLoad
 * @property {Object} [style]
 */

export {};
