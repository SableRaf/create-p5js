import { validateLanguage, validateP5Mode, validateVersion, validateMode } from '../../utils.js';

/** @typedef {import('../../types.js').ArgsValidated} ArgsValidated */
/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */


/**
 *
 * @param {CliArgs} args
 * @param {string[]} versions
 * @param {string} latest
 * @returns {{usingTemplate: true} | {usingTemplate:false, others: ArgsValidated}}
 */
export function stepValidateAllOtherArgs(args, versions, latest) {
  // Validate all other flags (skip if using --template, as they don't apply)
  if (args.template) {
    return { usingTemplate: true };
  }
  const validatedArgs = {};

  if (args.language) {
    const langError = validateLanguage(args.language);
    if (langError) {
      throw new Error(langError);
    }
    validatedArgs.language = args.language;
  }

  if (args['p5-mode']) {
    const p5ModeError = validateP5Mode(args['p5-mode']);
    if (p5ModeError) {
      throw new Error(p5ModeError);
    }
    validatedArgs["p5-mode"] = args["p5-mode"];
  }

  if (args.version) {
    const versionError = validateVersion(args.version, versions, latest);
    if (versionError) {
      throw new Error(versionError);
    }
    validatedArgs.version = args.version;
  }

  if (args.mode) {
    const modeError = validateMode(args.mode);
    if (modeError) {
      throw new Error(modeError);
    }
    validatedArgs.mode = args.mode;
  }
  //@ts-ignore TODO don't ignore, instead make the above validation type-safe
  return { usingTemplate: false, others: validatedArgs };
}
