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
 * Parses a semantic version string into its components
 * @param {string} version - Version string to parse (e.g., "1.9.0" or "2.1.0-rc.1")
 * @returns {{ major: number, minor: number, patch: number, prerelease: string|null }} Parsed version components
 */
export function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null
  };
}

/**
 * Fetches available @types/p5 versions from jsdelivr CDN API
 * @returns {Promise<string[]>} Array of available @types/p5 versions
 * @throws {Error} If network request fails or API is unreachable
 */
export async function fetchTypesVersions() {
  const apiUrl = 'https://data.jsdelivr.com/v1/package/npm/@types/p5';

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.versions;
  } catch (error) {
    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      throw new Error('Unable to reach jsdelivr CDN API for @types/p5. Please check your internet connection and try again.');
    }
    throw new Error(`Failed to fetch @types/p5 versions: ${error.message}`);
  }
}

/**
 * Finds the closest matching version from available versions
 * Prioritizes exact major.minor match, then closest minor within same major
 * @param {string} targetVersion - The target version to match (e.g., "1.4.0")
 * @param {string[]} availableVersions - Array of available versions to search
 * @returns {string|null} The closest matching version, or null if none found
 */
export function findClosestVersion(targetVersion, availableVersions) {
  const target = parseVersion(targetVersion);
  const candidates = availableVersions
    .map(v => {
      try {
        return parseVersion(v);
      } catch {
        return null;
      }
    })
    .filter(v => v !== null);

  // Filter to same major version
  const sameMajor = candidates.filter(v => v.major === target.major);
  if (sameMajor.length === 0) return null;

  // Try exact major.minor match first
  const sameMinor = sameMajor.filter(v => v.minor === target.minor);
  if (sameMinor.length > 0) {
    // Return highest patch in same major.minor
    sameMinor.sort((a, b) => b.patch - a.patch);
    return `${sameMinor[0].major}.${sameMinor[0].minor}.${sameMinor[0].patch}`;
  }

  // Find closest minor version
  sameMajor.sort((a, b) => Math.abs(a.minor - target.minor) - Math.abs(b.minor - target.minor));
  const closest = sameMajor[0];
  return `${closest.major}.${closest.minor}.${closest.patch}`;
}

/**
 * Determines whether to use @types/p5 or bundled types based on p5.js version
 * @param {string} version - The p5.js version
 * @returns {{ useTypesPackage: boolean, reason: string }} Strategy information
 */
export function getTypesStrategy(version) {
  const parsed = parseVersion(version);

  // p5.js 2.x uses bundled types (even 2.0.0-2.0.1, but will need to find closest available)
  if (parsed.major >= 2) {
    return {
      useTypesPackage: false,
      reason: 'p5.js 2.x has bundled types'
    };
  }

  // p5.js 1.x uses @types/p5
  return {
    useTypesPackage: true,
    reason: 'p5.js 1.x uses @types/p5 package'
  };
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
 * Uses a two-tier strategy:
 * - For p5.js 1.x: Downloads from @types/p5 package, finding closest version match
 * - For p5.js 2.x: Downloads bundled types from p5 package, finding closest version if needed
 * For instance-mode sketches, downloads only the main definition file.
 * For global-mode sketches, downloads both global.d.ts and main definition file.
 * @param {string} version - The p5.js version to download type definitions for
 * @param {string} targetDir - The directory path where type definitions should be saved
 * @param {Object} [spinner] - Optional spinner object with stop() method for progress feedback
 * @param {string} [template] - The template being used ('instance', 'basic', 'typescript', 'empty')
 * @returns {Promise<string>} The actual version of the type definitions downloaded
 * @throws {Error} If download fails or files cannot be written
 */
export async function downloadTypeDefinitions(version, targetDir, spinner = null, template = null) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';
  const isInstanceMode = template === 'instance';

  try {
    if (spinner) {
      spinner.message(t('spinner.downloadingTypes'));
    }

    // Determine strategy based on p5.js version
    const strategy = getTypesStrategy(version);
    let typeFiles;
    let actualTypesVersion;

    if (strategy.useTypesPackage) {
      // Use @types/p5 package for p5.js 1.x
      // Fetch available versions and find closest match
      const typesVersions = await fetchTypesVersions();
      const matchedVersion = findClosestVersion(version, typesVersions);

      if (!matchedVersion) {
        throw new Error(`No compatible @types/p5 version found for p5.js ${version}`);
      }

      actualTypesVersion = matchedVersion;

      // For @types/p5, the main file is index.d.ts
      typeFiles = isInstanceMode
        ? [{ name: 'index.d.ts', url: `${cdnBase}/@types/p5@${matchedVersion}/index.d.ts` }]
        : [
            { name: 'global.d.ts', url: `${cdnBase}/@types/p5@${matchedVersion}/global.d.ts` },
            { name: 'index.d.ts', url: `${cdnBase}/@types/p5@${matchedVersion}/index.d.ts` }
          ];
    } else {
      // Use bundled types from p5 package for 2.x
      // Try exact version first, then find closest if not available
      actualTypesVersion = version;

      typeFiles = isInstanceMode
        ? [{ name: 'p5.d.ts', url: `${cdnBase}/p5@${version}/types/p5.d.ts` }]
        : [
            { name: 'global.d.ts', url: `${cdnBase}/p5@${version}/types/global.d.ts` },
            { name: 'p5.d.ts', url: `${cdnBase}/p5@${version}/types/p5.d.ts` }
          ];

      // Test if types exist for this version
      const testResponse = await fetch(typeFiles[0].url);
      if (!testResponse.ok) {
        // Types not available for this version, find closest
        const { versions } = await fetchVersions();
        const matchedVersion = findClosestVersion(version, versions);

        if (!matchedVersion) {
          throw new Error(`No compatible p5.js version with bundled types found for ${version}`);
        }

        actualTypesVersion = matchedVersion;

        // Update URLs to use matched version
        typeFiles = isInstanceMode
          ? [{ name: 'p5.d.ts', url: `${cdnBase}/p5@${matchedVersion}/types/p5.d.ts` }]
          : [
              { name: 'global.d.ts', url: `${cdnBase}/p5@${matchedVersion}/types/global.d.ts` },
              { name: 'p5.d.ts', url: `${cdnBase}/p5@${matchedVersion}/types/p5.d.ts` }
            ];
      }
    }

    // Download and write all type definition files
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
      spinner.stop(t('spinner.downloadedTypes', { version: actualTypesVersion }));
    }

    return actualTypesVersion;
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
