import fs from 'fs/promises';
import path from 'node:path';
import { hasMessageStringProperty } from '../../exceptionUtils.js';
import { addLibToGitignore } from '../../git.js';
import * as display from '../../ui/display.js';
import { downloadP5Files } from '../../version.js';

/**
 * 
 * @param {string} targetPath 
 * @param {{verbose?:boolean}} opts
 * @param {string} selectedVersion 
 */
export async function stepDownloadP5Libs(targetPath, selectedVersion, opts) {
  const libPath = path.join(targetPath, 'lib');
  await fs.mkdir(libPath, { recursive: true });
  try {
    if (opts.verbose) {
      const downloadSpinner = display.spinner('spinner.downloadingP5File', { filename: 'p5.js' });
      await downloadP5Files(selectedVersion, libPath, downloadSpinner);
      downloadSpinner.stop('spinner.downloadedP5');
    } else {
      await downloadP5Files(selectedVersion, libPath);
    }
    await addLibToGitignore(targetPath);
  } catch (error) {
    display.error('error.fetchVersions.failed');
    if (hasMessageStringProperty(error)) {
      display.message(error.message);
    }
    display.message('');
    display.info('error.cleanup');
    //TODO: integrate #57 "revise project cleanup"
    process.exit(1);
  }
}
