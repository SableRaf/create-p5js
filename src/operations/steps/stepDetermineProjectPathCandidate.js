import * as display from '../../ui/display.js';
import * as prompts from '../../ui/prompts.js';
import { generateProjectName } from '../../utils.js';

/** @typedef {import('../../types.js').CliArgs} CliArgs */

/**
 * @param {CliArgs} args
 * @returns {Promise<string>} project path candidate, whether user-provided or generated. (This still needs validation)
 */
export async function stepDetermineProjectPathCandidate(args) {
  const firstArg = args._[0];

  if (firstArg && firstArg !== 'update') {
    // User provided a path as first argument
    return firstArg;
  }

  if (args.yes || args.template) {
    // --yes or --template flag: use random project name
    return generateProjectName();
  }

  // Interactive mode: prompt for path
  const randomName = generateProjectName();
  const projectPathCandidate = await prompts.promptProjectPath(`${randomName}`);
  if (prompts.isCancel(projectPathCandidate)) {
    display.cancel('prompt.cancel.sketchCreation');
  }
  return projectPathCandidate;
}
