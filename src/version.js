import { writeFile } from './utils.js';
import { t } from './i18n/index.js';

/**
 * Checks if a version string is a stable release (semver compliant: X.Y.Z)
 * @param {string} version - Version string to check (e.g., "1.9.0" or "2.1.0-rc.1")
 * @returns {boolean} True if version is stable (no pre-release suffix), false otherwise
 */
export function isStableVersion(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Filters an array of version strings to include only stable releases
 * @param {string[]} versions - Array of version strings to filter
 * @returns {string[]} Array containing only stable version strings (X.Y.Z format)
 */
export function filterStableVersions(versions) {
  return versions.filter(isStableVersion);
}

/**
 * Fetches available p5.js versions from jsdelivr CDN API
 * @param {boolean} [includePrerelease=false] - Whether to include pre-release versions (RC, beta, alpha)
 * @returns {Promise<{ latest: string, versions: string[] }>} Object containing latest version and array of all versions (stable only if includePrerelease is false)
 * @throws {Error} If network request fails or API is unreachable
 */
export async function fetchVersions(includePrerelease = false) {
  const apiUrl = 'https://data.jsdelivr.com/v1/package/npm/p5';

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const latest = data.tags.latest;

    // Filter versions based on includePrerelease flag
    let versions = data.versions;
    if (!includePrerelease) {
      versions = filterStableVersions(versions);
    }

    return { latest, versions };
  } catch (error) {
    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      throw new Error('Unable to reach jsdelivr CDN API. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to fetch p5.js versions: ${error.message}`);
  }
}

/**
 * Downloads p5.js files for local mode from jsdelivr CDN
 * @param {string} version - The p5.js version to download
 * @param {string} targetDir - The directory path where files should be saved
 * @param {Object} [spinner] - Optional spinner object with stop() method for progress feedback
 * @returns {Promise<void>}
 * @throws {Error} If download fails or files cannot be written
 */
export async function downloadP5Files(version, targetDir, spinner = null) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';

  // Download both regular and minified versions
  const files = [
    { url: `${cdnBase}/p5@${version}/lib/p5.js`, name: 'p5.js' },
    { url: `${cdnBase}/p5@${version}/lib/p5.min.js`, name: 'p5.min.js' }
  ];

  try {
    for (const file of files) {
      if (spinner) {
        spinner.message(t('spinner.downloadingP5File', { filename: file.name }));
      }

      const response = await fetch(file.url);

      if (!response.ok) {
        throw new Error(`Failed to download ${file.name}: HTTP ${response.status}`);
      }

      const content = await response.text();
      const targetPath = `${targetDir}/${file.name}`;
      await writeFile(targetPath, content, 'utf-8');
    }

    if (spinner) {
      spinner.stop(t('spinner.downloadedP5'));
    }
  } catch (error) {
    if (spinner) {
      spinner.stop(t('spinner.failedP5'));
    }

    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      throw new Error('Unable to download p5.js files. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to download p5.js files: ${error.message}`);
  }
}

/**
 * Downloads TypeScript type definitions for p5.js from jsdelivr CDN.
 * For instance-mode sketches, downloads only p5.d.ts.
 * For global-mode sketches, downloads both global.d.ts and p5.d.ts.
 * Falls back to the latest version if the specified version's types are not found.
 * @param {string} version - The p5.js version to download type definitions for
 * @param {string} targetDir - The directory path where type definitions should be saved
 * @param {Object} [spinner] - Optional spinner object with stop() method for progress feedback
 * @param {string} [template] - The template being used ('instance', 'basic', 'typescript', 'empty')
 * @returns {Promise<string>} The actual version of the type definitions downloaded
 * @throws {Error} If download fails or files cannot be written
 */
export async function downloadTypeDefinitions(version, targetDir, spinner = null, template = null) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';

  // Determine which files to download based on template
  // Instance mode only needs p5.d.ts, global mode needs both
  const isInstanceMode = template === 'instance';
  const typeFiles = isInstanceMode
    ? [{ name: 'p5.d.ts', url: `${cdnBase}/p5@${version}/types/p5.d.ts` }]
    : [
        { name: 'global.d.ts', url: `${cdnBase}/p5@${version}/types/global.d.ts` },
        { name: 'p5.d.ts', url: `${cdnBase}/p5@${version}/types/p5.d.ts` }
      ];

  try {
    if (spinner) {
      spinner.message(t('spinner.downloadingTypes'));
    }

    // Try to download the exact version first
    let response = await fetch(typeFiles[0].url);
    let actualVersion = version;

    // If not found, fallback to latest p5.js version
    if (!response.ok) {
      const { latest } = await fetchVersions();
      actualVersion = latest;
      // Update URLs to use latest version
      typeFiles[0].url = `${cdnBase}/p5@${latest}/types/global.d.ts`;
      typeFiles[1].url = `${cdnBase}/p5@${latest}/types/p5.d.ts`;
      response = await fetch(typeFiles[0].url);
    }

    if (response.ok) {
      // Download and write both type definition files
      for (const file of typeFiles) {
        const fileResponse = await fetch(file.url);

        if (!fileResponse.ok) {
          throw new Error(`Failed to download ${file.name}: HTTP ${fileResponse.status}`);
        }

        const content = await fileResponse.text();
        const targetPath = `${targetDir}/${file.name}`;
        await writeFile(targetPath, content, 'utf-8');
      }

      if (spinner) {
        spinner.stop(t('spinner.downloadedTypes', { version: actualVersion }));
      }
    }

    return actualVersion;
  } catch (error) {
    if (spinner) {
      spinner.stop(t('spinner.failedTypes'));
    }

    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      throw new Error('Unable to download TypeScript definitions. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to download TypeScript definitions: ${error.message}`);
  }
}
