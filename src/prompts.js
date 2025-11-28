import * as p from '@clack/prompts';

/**
 * Displays a version selection prompt to the user
 * @param {string[]} versions - Array of available version strings in descending order
 * @param {string} latest - The latest stable version string
 * @returns {Promise<string>} The selected version string
 */
export async function selectVersion(versions, latest) {
  return await p.select({
    message: 'Select p5.js version:',
    options: versions.map(v => ({
      value: v,
      label: v === latest ? `${v} (latest)` : v
    }))
  });
}

/**
 * Displays a delivery mode selection prompt to the user
 * @returns {Promise<string>} The selected mode ('cdn' or 'local')
 */
export async function selectMode() {
  return await p.select({
    message: 'Select delivery mode:',
    options: [
      {
        value: 'cdn',
        label: 'CDN',
        hint: 'Load p5.js from jsdelivr CDN (recommended for most users)'
      },
      {
        value: 'local',
        label: 'Local',
        hint: 'Download p5.js files to your project (works offline)'
      }
    ]
  });
}
