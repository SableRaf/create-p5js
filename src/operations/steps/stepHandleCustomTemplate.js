import { hasMessageStringProperty } from '../../exceptionUtils.js';
import { fetchTemplate, normalizeTemplateSpec } from '../../templateFetcher.js';
import * as display from '../../ui/display.js';
// i18n
import { t } from '../../i18n/index.js';

/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */


/**
 * 
 * @param {string} templateString 
 * @param {string} targetPath 
 * @param {string} projectName 
 * @param {{verbose?:boolean}} opts
 * @returns {Promise<never>}
 */
export async function stepHandleCustomTemplate(templateString, targetPath, projectName, opts) {
  const copySpinner = display.spinner('spinner.fetchingRemoteTemplate');
  if (opts.verbose) {
    const spec = normalizeTemplateSpec(templateString);
    display.info('note.verbose.remoteTemplateSpec', { spec });
    display.info('note.verbose.targetPath', { path: targetPath });
  }
  try {
    await fetchTemplate(templateString, targetPath, { verbose: opts.verbose });
    copySpinner.stop('spinner.fetchedRemoteTemplate');
  } catch (err) {
    copySpinner.stop('spinner.failedRemoteTemplate');
    const errMsg = hasMessageStringProperty(err) ? err.message : "unknown error";
    throw new Error(t('error.fetchTemplate', { template: templateString, error: errMsg }));
  }

  // Success! Community templates are used as-is, no modifications
  // Show next steps before outro
  const nextStepsLines = [
    'note.nextSteps.step1',
    'note.communityTemplate.checkReadme'
  ];
  display.note(nextStepsLines, 'note.nextSteps.title', { projectName });

  // outro() exits the process - nothing after this executes
  display.outro(t('note.success.created'));
}

