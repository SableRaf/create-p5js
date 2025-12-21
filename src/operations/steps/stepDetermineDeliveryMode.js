import * as display from '../../ui/display.js';
import * as prompts from '../../ui/prompts.js';
/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */


/**
 * @param {DeliveryMode | undefined} deliveryModeFromArgs
 * @param {SetupType} setupType 
 * @returns {Promise<DeliveryMode>} selected delivery mode (may also exit)
 */
export async function stepDetermineDeliveryMode(deliveryModeFromArgs, setupType) {
  if (deliveryModeFromArgs) {
    const selectedDeliveryMode = deliveryModeFromArgs;
    display.success('info.usingMode', { mode: selectedDeliveryMode });
    return selectedDeliveryMode;
  } 
  if (setupType === 'basic' || setupType === 'standard') {
    const selectedDeliveryMode = 'cdn';
    display.success('info.defaultMode');
    return selectedDeliveryMode;
  }

  // Interactive customization mode (custom)
  const selectedDeliveryMode = await prompts.promptMode();
  if (prompts.isCancel(selectedDeliveryMode)) {
    display.cancel('prompt.cancel.sketchCreation');
  }
  return selectedDeliveryMode;

}
