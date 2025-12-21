import * as display from '../../ui/display.js';
import * as prompts from '../../ui/prompts.js';


/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */

/**
 * @param {{language?: Language, "p5-mode": P5Mode}} args 
 * @param {SetupType} setupType 
 * @returns {Promise<{selectedLanguage: Language, selectedP5Mode: P5Mode}>}
 */
export async function stepDetermineLanguageAndP5Mode(args, setupType) {
  if (args.language && args['p5-mode']) {
    // Non-interactive with flags
    const selectedLanguage = args.language;
    const selectedP5Mode = args['p5-mode'];
    display.success('info.usingLanguageMode', { language: selectedLanguage, p5Mode: selectedP5Mode });
    return {selectedLanguage, selectedP5Mode};
  } 
  if (setupType === 'basic' || setupType === 'standard') {
    // Use defaults: JavaScript + Global mode for basic and standard setups
    const selectedLanguage = 'javascript';
    const selectedP5Mode = 'global';
    display.success('info.defaultLanguageMode');
    return {selectedLanguage, selectedP5Mode}
  }

  // Interactive customization mode (custom): prompt for language and mode
  const choices = await prompts.promptLanguageAndMode();
  if (prompts.isCancel(choices)) {
    display.cancel('prompt.cancel.sketchCreation');
  }
  const [selectedLanguage, selectedP5Mode] = choices;  
  return {selectedLanguage, selectedP5Mode};
}
