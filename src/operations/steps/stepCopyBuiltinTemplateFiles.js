import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as display from '../../ui/display.js';
import { copyTemplateFiles, getTemplateName } from '../../utils.js';

/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */

/**
 * 
 * @param {SetupType} setupType 
 * @param {Language} selectedLanguage 
 * @param {P5Mode} selectedP5Mode 
 * @param {string} targetPath 
 * @param {{verbose?: boolean}} options
 */
export async function stepCopyBuiltinTemplateFiles(setupType, selectedLanguage, selectedP5Mode, targetPath, options) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Basic setup always uses minimal template    
  // Standard and custom use template based on language and mode
  const templateDir = (setupType === 'basic') ?  'minimal-global-js' : getTemplateName(selectedLanguage, selectedP5Mode);
  
  const templatePath = path.join(__dirname, '..', '..', '..', 'templates', templateDir);

  if (options.verbose) {
    const copySpinner = display.spinner('spinner.copyingTemplate');
    display.info('note.verbose.templatePath', { path: templatePath });
    display.info('note.verbose.targetPath', { path: targetPath });
    await copyTemplateFiles(templatePath, targetPath);
    copySpinner.stop('spinner.copiedTemplate');
  } else {
    await copyTemplateFiles(templatePath, targetPath);
  }
}
