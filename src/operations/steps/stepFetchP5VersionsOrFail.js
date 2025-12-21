import { hasMessageStringProperty } from '../../exceptionUtils.js';
import * as display from '../../ui/display.js';
import { fetchVersions } from '../../version.js';
/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */


/**
 * 
 * @param {{verbose?:boolean, "include-prerelease"?:boolean}} args
 * @returns {Promise<{latest: string, versions: string[]}>}
 */
export async function stepFetchP5VersionsOrFail(args) {
  
    if (args.verbose) {
      const s = display.spinner('spinner.fetchingVersions');
      try {
        const { latest, versions } = await fetchVersions(args['include-prerelease']);
        s.stop('spinner.fetchedVersions');
        if (args['include-prerelease']) {
          display.info('info.includePrerelease');
        }
        return {latest, versions}
      } catch (error) {
        s.stop('spinner.failedVersions');
        reportFetchFailAndExit(error);
      }
    }

    try {
      const { latest, versions } = await fetchVersions(args['include-prerelease']);
      if (args['include-prerelease']) {
        display.info('info.includePrerelease');
      }
      return {latest, versions}
    } catch (error) {
      reportFetchFailAndExit(error);
    }    
}

/**
 * @param {unknown} error 
 * @returns {never}
 */
function reportFetchFailAndExit(error) {
    display.message('');
    display.error('error.fetchVersions.failed');
    if (hasMessageStringProperty(error)) {
        display.message(error.message);
    }
    display.message('');
    display.info('error.fetchVersions.troubleshooting');
    display.info('error.fetchVersions.step1');
    display.info('error.fetchVersions.step2');
    display.info('error.fetchVersions.step3');
    process.exit(1);
}

