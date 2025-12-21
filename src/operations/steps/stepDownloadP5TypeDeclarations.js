import fs from 'fs/promises';
import path from 'node:path';
import { hasMessageStringProperty } from '../../exceptionUtils.js';
import * as display from '../../ui/display.js';
import { downloadTypeDefinitions } from '../../version.js';
/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */

/**
 * 
 * @param {string} targetPath 
 * @param {P5Mode} selectedP5Mode 
 * @param {CliArgs} args 
 * @param {string} selectedVersion 
 * @returns {Promise<string | null>}
 */
export async function stepDownloadP5TypeDeclarations(targetPath, selectedP5Mode, args, selectedVersion) {
  const typesPath = path.join(targetPath, 'types');
  await fs.mkdir(typesPath, { recursive: true });
  try {
    // Determine template mode for type definitions (global vs instance)
    const templateMode = selectedP5Mode || 'global'; // Default to global if using community template
    let typeDefsVersion;
    if (args.verbose) {
      const typesSpinner = display.spinner('spinner.downloadingTypes');
      typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath, typesSpinner, templateMode);
    } else {
      typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath, null, templateMode);
    }
    return typeDefsVersion;
  } catch (error) {
    display.warn('error.fetchVersions.failed');
    if (hasMessageStringProperty(error)) {
      display.message(error.message);
    }
    display.info('info.continueWithoutTypes');
    // Don't fail the entire operation if type definitions fail
    return null;
  }
}
