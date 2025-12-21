//@ts-nocheck TODO: have this file also typecheck.  For now focus is on scaffold
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
      await writeFile(targetPath, content);
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
 * Downloads TypeScript type definitions for p5.js.
 * Uses a simple two-tier strategy:
 * - For p5.js 1.x: Copies minimal global.d.ts (global-mode) or instance.d.ts (instance.mode) from repo (tells VS Code to auto-acquire from @types/p5)
 * - For p5.js 2.x: Downloads bundled types from p5 package with hardcoded fallback for 2.0.0-2.0.1
 * For instance-mode sketches, downloads only the main definition file.
 * For global-mode sketches, downloads both global.d.ts and main definition file.
 * @param {string} p5Version - The p5.js version to download type definitions for
 * @param {string} targetDir - The directory path where type definitions should be saved
 * @param {Object|null} spinner - Optional spinner object with stop() method for progress feedback
 * @param {string|null} template - The template being used ('instance', 'basic', 'typescript', 'empty')
 * @param {string|null} previousVersion - Optional previous p5.js version (for detecting major version changes)
 * @returns {Promise<string>} The actual types version used
 * @throws {Error} If download fails
 */
export async function downloadTypeDefinitions(p5Version, targetDir, spinner = null, template = null, previousVersion = null) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';
  const isInstanceMode = template === 'instance';

  try {
    // Determine strategy based on p5.js version
    const strategy = getTypesStrategy(p5Version);

    // Check if we're downgrading from 2.x to 1.x
    if (previousVersion) {
      const prevStrategy = getTypesStrategy(previousVersion);
      const isDowngrading = !prevStrategy.useTypesPackage && strategy.useTypesPackage;

      if (isDowngrading) {
        // Clear the types folder when downgrading from 2.x to 1.x
        const { removeDirectory } = await import('./utils.js');        
        await removeDirectory(targetDir);

        // Recreate the directory
        const { createDirectory } = await import('./utils.js');
        await createDirectory(targetDir);
      }
    }

    if (strategy.useTypesPackage) {
      // p5.js 1.x: Copy minimal global.d.ts from repo
      // This file tells VS Code to auto-acquire from @types/p5 package
      if (spinner) {
        spinner.message(t('spinner.downloadingTypes'));
      }

      // Copy the minimal global.d.ts file from the repo
      const { copyFile } = await import('fs/promises');
      const { fileURLToPath } = await import('url');
      const { dirname, join } = await import('path');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const sourceFileName = isInstanceMode ? 'instance.d.ts': 'global.d.ts'
      const sourceFilePath = join(__dirname, '..', 'types', 'default', 'v1', sourceFileName);
      const targetPath = `${targetDir}/${sourceFileName}`;

      await copyFile(sourceFilePath, targetPath);

      if (spinner) {
        spinner.stop(t('spinner.downloadedTypes', { version: '1.7.7' }));
      }

      return '1.7.7'; // Fixed version for reference only
    } else {
      // p5.js 2.x: Download bundled types with simple fallback
      let typesVersion = p5Version;

      // Hardcoded fallback for 2.0.0, 2.0.1, and any pre-releases thereof
      if (p5Version === '2.0.0' || p5Version.startsWith('2.0.0-') || p5Version === '2.0.1') {
        typesVersion = '2.0.2';
      }

      const typeFiles = isInstanceMode
        ? [{ name: 'p5.d.ts', url: `${cdnBase}/p5@${typesVersion}/types/p5.d.ts` }]
        : [
            { name: 'global.d.ts', url: `${cdnBase}/p5@${typesVersion}/types/global.d.ts` },
            { name: 'p5.d.ts', url: `${cdnBase}/p5@${typesVersion}/types/p5.d.ts` }
          ];

      // Download and write all type definition files
      if (spinner) {
        spinner.message(t('spinner.downloadingTypes'));
      }

      for (const file of typeFiles) {
        const fileResponse = await fetch(file.url);

        if (!fileResponse.ok) {
          throw new Error(`Failed to download ${file.name}: HTTP ${fileResponse.status}`);
        }

        const content = await fileResponse.text();
        const targetPath = `${targetDir}/${file.name}`;
        await writeFile(targetPath, content);
      }

      if (spinner) {
        spinner.stop(t('spinner.downloadedTypes', { version: typesVersion }));
      }

      return typesVersion;
    }
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
