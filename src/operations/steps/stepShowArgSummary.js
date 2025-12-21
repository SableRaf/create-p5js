import * as display from '../../ui/display.js';

/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */
/** @typedef {import('../../types.js').Selections} Selections */
/** @typedef {import('../../types.js').ArgsValidated} ArgsValidated */

/**
 * @param {Selections} selections
 * @param {string} projectName
 * @param {CliArgs} args
*/
export function stepShowArgSummary(projectName, selections, args) {
  display.message('');
  const configLines = [
    'info.config.header',
    'info.config.projectName'
  ];
  if (selections.selectedLanguage) {
    configLines.push('info.config.language', 'info.config.p5Mode');
  }
  configLines.push(
    'info.config.version',
    'info.config.mode',
    args.git ? 'info.config.git.yes' : 'info.config.git.no',
    args.types === false ? 'info.config.types.no' : 'info.config.types.yes'
  );
  configLines.forEach(key => display.info(key, {
    name: projectName,
    language: selections.selectedLanguage,
    p5Mode: selections.selectedP5Mode,
    version: selections.selectedVersion,
    mode: selections.selectedDeliveryMode
  }));
  display.message('');
}
