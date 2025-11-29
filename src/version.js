import { writeFile } from './utils.js';

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
 * @returns {Promise<{ latest: string, versions: string[] }>} Object containing latest version and array of up to 15 most recent versions
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

    // Limit to 15 most recent versions AFTER filtering
    versions = versions.slice(0, 15);

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
        spinner.message(`Downloading ${file.name}...`);
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
      spinner.stop(`p5.js files downloaded successfully`);
    }
  } catch (error) {
    if (spinner) {
      spinner.stop(`Failed to download p5.js files`);
    }

    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      throw new Error('Unable to download p5.js files. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to download p5.js files: ${error.message}`);
  }
}

/**
 * Downloads TypeScript type definitions for p5.js from jsdelivr CDN.
 * Falls back to the latest version if the specified version's types are not found.
 * @param {string} version - The p5.js version to download type definitions for
 * @param {string} targetDir - The directory path where type definitions should be saved
 * @param {Object} [spinner] - Optional spinner object with stop() method for progress feedback
 * @returns {Promise<string>} The actual version of the type definitions downloaded
 * @throws {Error} If download fails or files cannot be written
 */
export async function downloadTypeDefinitions(version, targetDir, spinner = null) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';
  const typeUrl = `${cdnBase}/p5@${version}/types/global.d.ts`;

  try {
    if (spinner) {
      spinner.message('Downloading TypeScript definitions...');
    }

    // Try to download the exact version first
    let response = await fetch(typeUrl);
    let actualVersion = version;

    // If not found, fallback to latest p5.js version
    if (!response.ok) {
      const { latest } = await fetchVersions();
      const latestTypeUrl = `${cdnBase}/p5@${latest}/types/global.d.ts`;
      response = await fetch(latestTypeUrl);
      actualVersion = latest;
    }

    if (response.ok) {
      const content = await response.text();
      const targetPath = `${targetDir}/global.d.ts`;
      await writeFile(targetPath, content, 'utf-8');

      if (spinner) {
        spinner.stop(`TypeScript definitions downloaded (v${actualVersion})`);
      }
    }

    return actualVersion;
  } catch (error) {
    if (spinner) {
      spinner.stop('Failed to download TypeScript definitions');
    }

    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      throw new Error('Unable to download TypeScript definitions. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to download TypeScript definitions: ${error.message}`);
  }
}
