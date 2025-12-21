import * as display from '../../ui/display.js';
import * as prompts from '../../ui/prompts.js';
import { isCancel } from '../../ui/prompts.js';
import { getValidSetupTypes, validateSetupType } from '../../utils.js';

/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */
/**
 * @param {CliArgs} args
 * @returns {Promise<SetupType | "handleInTemplate">}
 */

export async function stepDetermineSetupType(args) {

  const hasConfigFlags = args.language || args['p5-mode'] || args.version || args.mode;

  if (args.template) {
    return "handleInTemplate";
    // When using --template, skip setup type - it will be handled in the template section
  }

  if (hasConfigFlags) {
    // If user provided config flags, they clearly want to customize
    return 'custom';
  }

  if (args.type) {
    if (!validateSetupType(args.type)) {
      display.error('error.invalidSetupType');
      display.message(`Invalid setup type: ${args.type}. Must be one of: ${getValidSetupTypes().join(', ')}`);
      process.exit(1);
    }
    return args.type;

  }

  if (!args.yes && !hasConfigFlags) {
    // Interactive mode without config flags: ask for setup type
    const setupType = await prompts.promptSetupType();
    if (isCancel(setupType)) {
      display.cancel('prompt.cancel.sketchCreation');
    }
    return setupType;
  }

  // If --yes flag without --type, setupType remains 'standard' (use defaults)
  return "standard";
}
