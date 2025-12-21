import * as display from '../../ui/display.js';
import * as prompts from '../../ui/prompts.js';
/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */



/**
 * 
 * @param {string | undefined} versionFromArgs 
 * @param {string} latest 
 * @param {string[]} versions 
 * @param {SetupType} setupType 
 * @returns {Promise<string>} selected version.  may alternatively exit.
 */
export async function stepDetermineP5Version(versionFromArgs, latest, versions, setupType) {
  if (versionFromArgs) {
    const selectedVersion = versionFromArgs === 'latest' ? latest : versionFromArgs;
    display.success('info.usingVersion', { version: selectedVersion });
    return selectedVersion;
  }
  
  if (setupType === 'basic' || setupType === 'standard') {
    // Use default (latest) for basic and standard setups
    const selectedVersion = latest;
    display.success('info.latestVersion', { version: latest });
    return selectedVersion;
  }

  // Interactive customization mode (custom)
  const selectedVersion = await prompts.promptVersion(versions, latest);
  if (prompts.isCancel(selectedVersion)) {
    display.cancel('prompt.cancel.sketchCreation');
  }
  return selectedVersion;
}
