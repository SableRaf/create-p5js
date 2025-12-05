import { writeFile } from './utils.js';
import { t } from './i18n/index.js';
import * as prompts from './ui/prompts.js';
import * as display from './ui/display.js';

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
 * Converts a parsed version object into a flattened integer for distance calculation
 * Uses padding to handle multi-digit version components correctly
 * @param {{ major: number, minor: number, patch: number }} v - Parsed version object
 * @returns {number} Flattened version as integer (e.g., {1, 7, 9} -> 10709)
 */
function flattenVersion(v) {
  return v.major * 10000 + v.minor * 100 + v.patch;
}

/**
 * Finds the closest matching version from available versions using distance-based fallback
 * Rules:
 * 1. Only compares versions with the same MAJOR
 * 2. If exact match exists, returns it
 * 3. If versions with same MINOR exist, picks closest by PATCH distance (higher patch wins ties)
 * 4. If no same MINOR, uses flattened distance on entire version (higher version wins ties)
 * @param {string} targetVersion - The target version to match (e.g., "1.7.9")
 * @param {string[]} availableVersions - Array of available versions to search
 * @returns {string|null} The closest matching version, or null if none found
 */
export function findClosestVersion(targetVersion, availableVersions) {
  const target = parseVersion(targetVersion);

  // Parse all available versions and filter valid ones
  const candidates = availableVersions
    .map(v => {
      try {
        return { version: v, parsed: parseVersion(v) };
      } catch {
        return null;
      }
    })
    .filter(v => v !== null);

  // 1) Filter by same major
  const sameMajor = candidates.filter(c => c.parsed.major === target.major);
  if (sameMajor.length === 0) return null;

  // 2) Check for exact match
  for (const candidate of sameMajor) {
    const p = candidate.parsed;
    if (p.minor === target.minor && p.patch === target.patch) {
      return candidate.version;
    }
  }

  // 3) Same-minor case: compare by patch distance
  const sameMinor = sameMajor.filter(c => c.parsed.minor === target.minor);

  if (sameMinor.length > 0) {
    let best = null;
    let bestDistance = Infinity;

    for (const candidate of sameMinor) {
      const p = candidate.parsed;
      const distance = Math.abs(p.patch - target.patch);

      if (
        distance < bestDistance ||
        (distance === bestDistance && p.patch > best.parsed.patch)
      ) {
        best = candidate;
        bestDistance = distance;
      }
    }

    return best.version;
  }

  // 4) No same minor: use flattened distance
  const flatTarget = flattenVersion(target);

  let best = null;
  let bestDistance = Infinity;
  let bestFlat = -Infinity;

  for (const candidate of sameMajor) {
    const p = candidate.parsed;
    const flat = flattenVersion(p);
    const distance = Math.abs(flat - flatTarget);

    if (
      distance < bestDistance ||
      (distance === bestDistance && flat > bestFlat)
    ) {
      best = candidate;
      bestDistance = distance;
      bestFlat = flat;
    }
  }

  return best ? best.version : null;
}

/**
 * Finds exact match by major.minor version (closest patch within that minor version)
 * Returns null if no exact major.minor match exists
 * Uses same distance algorithm as findClosestVersion for same-minor matching
 * @param {string} targetVersion - The target version to match (e.g., "1.4.0")
 * @param {string[]} availableVersions - Array of available versions to search
 * @returns {string|null} Exact major.minor match (closest patch) or null if not found
 */
export function findExactMinorMatch(targetVersion, availableVersions) {
  const target = parseVersion(targetVersion);
  const candidates = availableVersions
    .map(v => {
      try {
        return { version: v, parsed: parseVersion(v) };
      } catch {
        return null;
      }
    })
    .filter(v => v !== null);

  // Filter to exact major.minor match
  const exactMatches = candidates.filter(
    c => c.parsed.major === target.major && c.parsed.minor === target.minor
  );

  if (exactMatches.length === 0) {
    return null;
  }

  // Find closest patch using distance algorithm
  let best = null;
  let bestDistance = Infinity;

  for (const candidate of exactMatches) {
    const p = candidate.parsed;
    const distance = Math.abs(p.patch - target.patch);

    if (
      distance < bestDistance ||
      (distance === bestDistance && p.patch > best.parsed.patch)
    ) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best.version;
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
 * Validates which @types/p5 versions are actually available on jsdelivr CDN
 * @param {string[]} versions - Array of @types/p5 version strings to check
 * @returns {Promise<string[]>} Array of versions that are available
 */
export async function filterAvailableTypesVersions(versions) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';
  const validVersions = [];

  // Test each version by checking if index.d.ts exists
  for (const version of versions) {
    try {
      const testUrl = `${cdnBase}/@types/p5@${version}/index.d.ts`;
      const response = await fetch(testUrl, { method: 'HEAD' });

      if (response.ok) {
        validVersions.push(version);
      }
    } catch (error) {
      // Skip versions that fail to fetch
      continue;
    }
  }

  return validVersions;
}

/**
 * Validates which p5.js 2.x versions have bundled TypeScript definitions available
 * @param {string[]} versions - Array of p5.js version strings to check
 * @returns {Promise<string[]>} Array of versions that have bundled types available
 */
export async function filterVersionsWithBundledTypes(versions) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';
  const validVersions = [];

  // Test each version by checking if global.d.ts exists
  for (const version of versions) {
    try {
      const testUrl = `${cdnBase}/p5@${version}/types/global.d.ts`;
      const response = await fetch(testUrl, { method: 'HEAD' });

      if (response.ok) {
        validVersions.push(version);
      }
    } catch (error) {
      // Skip versions that fail to fetch
      continue;
    }
  }

  return validVersions;
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
 * Resolves which TypeScript definitions version to use for a given p5.js version.
 * Uses a two-tier strategy with interactive version selection when needed:
 * - For p5.js 1.x: Uses @types/p5 package, prompts if no exact match
 * - For p5.js 2.x: Uses bundled types from p5 package, prompts if version unavailable
 * @param {string} p5Version - The p5.js version to find type definitions for
 * @param {Object} [spinner] - Optional spinner object with stop() method for progress feedback
 * @param {boolean} [isInteractive=true] - Whether to prompt user for version selection
 * @returns {Promise<string|null>} The resolved types version, or null if cancelled/unavailable
 * @throws {Error} If fetching available versions fails
 */
export async function resolveTypesVersion(p5Version, spinner = null, isInteractive = true) {
  try {
    // Determine strategy based on p5.js version
    const strategy = getTypesStrategy(p5Version);

    if (strategy.useTypesPackage) {
      // Use @types/p5 package for p5.js 1.x
      if (spinner) {
        spinner.message(t('spinner.lookingUpTypes'));
      }

      const typesVersions = await fetchTypesVersions();

      // Validate which versions are actually available
      const validTypesVersions = await filterAvailableTypesVersions(typesVersions);

      if (spinner) {
        spinner.stop(t('spinner.lookedUpTypes'));
      }

      // Try to find exact major.minor match first
      const exactMatch = findExactMinorMatch(p5Version, validTypesVersions);

      if (exactMatch) {
        // Found exact match, use it without prompting
        return exactMatch;
      } else {
        // No exact match - need to select a version
        const recommendedVersion = findClosestVersion(p5Version, validTypesVersions);

        if (!recommendedVersion) {
          throw new Error(`No compatible @types/p5 version found for p5.js ${p5Version}`);
        }

        if (isInteractive) {
          // Prompt user to select version
          if (spinner) {
            spinner.stop();
          }

          const selectedVersion = await prompts.promptTypesVersion(
            validTypesVersions,
            p5Version,
            recommendedVersion
          );

          if (prompts.isCancel(selectedVersion)) {
            display.cancel('prompt.cancel.typesSelection');
            return null;
          }

          return selectedVersion;
        } else {
          // Non-interactive mode: use recommended version
          display.info('info.autoSelectedTypes', {
            p5Version: p5Version,
            typesVersion: recommendedVersion
          });
          return recommendedVersion;
        }
      }
    } else {
      // Use bundled types from p5 package for 2.x
      const cdnBase = 'https://cdn.jsdelivr.net/npm';

      // Test if types exist for this exact version
      const testUrl = `${cdnBase}/p5@${p5Version}/types/global.d.ts`;
      const testResponse = await fetch(testUrl);

      if (testResponse.ok) {
        // Exact version has types available
        return p5Version;
      }

      // Types not available for this version - need to select alternative
      if (spinner) {
        spinner.message(t('spinner.lookingUpTypes'));
      }

      const { versions } = await fetchVersions();

      // Filter to only 2.x versions
      const v2Versions = versions.filter(v => {
        try {
          const parsed = parseVersion(v);
          return parsed.major === 2;
        } catch {
          return false;
        }
      });

      // Validate which versions actually have bundled types available
      const validV2Versions = await filterVersionsWithBundledTypes(v2Versions);

      if (spinner) {
        spinner.stop(t('spinner.lookedUpTypes'));
      }

      const recommendedVersion = findClosestVersion(p5Version, validV2Versions);

      if (!recommendedVersion) {
        throw new Error(`No compatible p5.js version with bundled types found for ${p5Version}`);
      }

      if (isInteractive) {
        // Prompt user to select version
        if (spinner) {
          spinner.stop();
        }

        const selectedVersion = await prompts.promptTypesVersion(
          validV2Versions,
          p5Version,
          recommendedVersion
        );

        if (prompts.isCancel(selectedVersion)) {
          display.cancel('prompt.cancel.typesSelection');
          return null;
        }

        return selectedVersion;
      } else {
        // Non-interactive mode: use recommended version
        display.info('info.autoSelectedTypes', {
          p5Version: p5Version,
          typesVersion: recommendedVersion
        });
        return recommendedVersion;
      }
    }
  } catch (error) {
    if (spinner) {
      spinner.stop(t('spinner.failedTypes'));
    }

    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      throw new Error('Unable to check TypeScript definitions availability. Please check your internet connection and try again.');
    }
    throw error;
  }
}

/**
 * Downloads TypeScript type definitions for p5.js from jsdelivr CDN.
 * Uses a two-tier strategy with interactive version selection when needed:
 * - For p5.js 1.x: Downloads from @types/p5 package, prompts if no exact match
 * - For p5.js 2.x: Downloads bundled types from p5 package, prompts if version unavailable
 * For instance-mode sketches, downloads only the main definition file.
 * For global-mode sketches, downloads both global.d.ts and main definition file.
 * @param {string} p5Version - The p5.js version to download type definitions for
 * @param {string} typesVersion - The resolved types version to download (from resolveTypesVersion)
 * @param {string} targetDir - The directory path where type definitions should be saved
 * @param {Object} [spinner] - Optional spinner object with stop() method for progress feedback
 * @param {string} [template] - The template being used ('instance', 'basic', 'typescript', 'empty')
 * @returns {Promise<string>} The actual version downloaded
 * @throws {Error} If download fails
 */
export async function downloadTypeDefinitions(p5Version, typesVersion, targetDir, spinner = null, template = null) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';
  const isInstanceMode = template === 'instance';

  try {
    // Determine strategy based on p5.js version
    const strategy = getTypesStrategy(p5Version);
    let typeFiles;

    if (strategy.useTypesPackage) {
      // For @types/p5, the main file is index.d.ts
      typeFiles = isInstanceMode
        ? [{ name: 'index.d.ts', url: `${cdnBase}/@types/p5@${typesVersion}/index.d.ts` }]
        : [
            { name: 'global.d.ts', url: `${cdnBase}/@types/p5@${typesVersion}/global.d.ts` },
            { name: 'index.d.ts', url: `${cdnBase}/@types/p5@${typesVersion}/index.d.ts` }
          ];
    } else {
      // Use bundled types from p5 package for 2.x
      typeFiles = isInstanceMode
        ? [{ name: 'p5.d.ts', url: `${cdnBase}/p5@${typesVersion}/types/p5.d.ts` }]
        : [
            { name: 'global.d.ts', url: `${cdnBase}/p5@${typesVersion}/types/global.d.ts` },
            { name: 'p5.d.ts', url: `${cdnBase}/p5@${typesVersion}/types/p5.d.ts` }
          ];
    }

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
      await writeFile(targetPath, content, 'utf-8');
    }

    if (spinner) {
      spinner.stop(t('spinner.downloadedTypes', { version: typesVersion }));
    }

    return typesVersion;
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
