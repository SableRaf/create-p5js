import { hasMessageStringProperty, isLoggingError } from '../exceptionUtils.js';
import * as display from '../ui/display.js';
import { directoryExists } from '../utils.js';
/** @typedef {import('../types.js').CliArgs} CliArgs */
/** @typedef {import('../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../types.js').Language} Language */
/** @typedef {import('../types.js').P5Mode} P5Mode */
/** @typedef {import('../types.js').SetupType} SetupType */


/**
 * @param {CliArgs} args
 * @param {unknown} error
 * @param {string} targetPath
 * @returns {Promise<never>}
 */
export async function handleErrorInScaffold(args, error, targetPath) {
  display.message('');
  // For template errors, the error.message already contains the full context
  // For version fetch errors, show a specific header
  if (!args.template) {
    display.error('error.fetchVersions.failed');
  }
  if (hasMessageStringProperty(error)) {
    display.message(error.message);
  }

  if (args.verbose && isLoggingError(error) && error.stack) {
    display.message('');
    display.info('info.stackTrace');
    display.message(error.stack);
  }

  // STEP: Attempt to clean up the project directory if it was partially created
  try {
    if (await directoryExists(targetPath)) {
      //TODO: update with #57 "revise project cleanup"
      const cleanupSpinner = display.spinner('spinner.cleaningUp');
      cleanupSpinner.stop('spinner.cleanedUp');
    }
  } catch (cleanupError) {
    display.warn('error.cleanup');
    if (hasMessageStringProperty(cleanupError)) {
      display.message(cleanupError.message);
    }
  }

  const helpLines = [
    'error.persistHelp.verbose',
    'error.persistHelp.permissions',
    'error.persistHelp.issues'
  ];
  display.note(helpLines, 'error.persistHelp.title');

  process.exit(1);
}
