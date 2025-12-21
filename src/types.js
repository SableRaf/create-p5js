
/** @typedef {"cdn"|"local"} DeliveryMode */
/** @typedef {'basic' | 'standard' | 'custom'} SetupType */
/** @typedef {"javascript"|"typescript"} Language */
/** @typedef {"global"|"instance"} P5Mode */

/** @typedef {Object} ArgsValidated
 * @property {Language} language
 * @property {P5Mode} p5-mode
 * @property {string} version
 * @property {DeliveryMode} mode
 */
/**
 * @typedef {object} CliArgs
 * @property {any[]} _
 * @property {boolean} [verbose]
 * @property {boolean} [yes]
 * @property {string} [language]
 * @property {string} [p5-mode]
 * @property {string} [version]
 * @property {string} [mode] 
 * @property {string} [type] 
 * @property {boolean} [types] 
 * @property {string} [template] 
 * @property {string} [git] 
 * @property {boolean} [include-prerelease]
 */

/**
 * @typedef {Object} Selections
 * @property {Language} selectedLanguage
 * @property {P5Mode} selectedP5Mode
 * @property {string} selectedVersion
 * @property {DeliveryMode} selectedDeliveryMode
 */