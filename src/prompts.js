import * as p from '@clack/prompts';
import Moniker from 'moniker';

/**
 * Generates a random, memorable project name using moniker
 * @returns {string} A random project name (e.g., 'amicable-elephant')
 */
export function generateProjectName() {
  return Moniker.choose();
}

/**
 * Creates and starts a spinner for long-running operations
 * @param {string} message - The message to display while spinning
 * @returns {Object} Spinner object with stop() method
 */
export function startSpinner(message) {
  const spinner = p.spinner();
  spinner.start(message);
  return spinner;
}

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
 * Displays a template selection prompt to the user
 * @returns {Promise<string>} The selected template name ('basic', 'instance', 'typescript', or 'empty')
 */
export async function selectTemplate() {
  return await p.select({
    message: 'Select template:',
    options: [
      {
        value: 'basic',
        label: 'Basic',
        hint: 'Standard p5.js with global mode (recommended for beginners)'
      },
      {
        value: 'instance',
        label: 'Instance Mode',
        hint: 'Multiple sketches on one page, avoids global namespace'
      },
      {
        value: 'typescript',
        label: 'TypeScript',
        hint: 'TypeScript setup with type definitions'
      },
      {
        value: 'empty',
        label: 'Empty',
        hint: 'Minimal HTML only, build your own structure'
      }
    ]
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

/**
 * Prompts user for project directory path with validation
 * @returns {Promise<string>} The validated directory path (relative or '.' for current)
 */
export async function promptProjectPath() {
  const randomName = generateProjectName();

  return await p.text({
    message: 'Where should we create your project?',
    placeholder: `. (current directory)`,
    initialValue: `./${randomName}`,
    validate: (value) => {
      const trimmed = value.trim();

      // Allow current directory
      if (trimmed === '.' || trimmed === '') {
        return;
      }

      // Enforce relative paths (no absolute paths)
      if (trimmed.startsWith('/') || /^[A-Za-z]:/.test(trimmed)) {
        return 'Please use a relative path (e.g., "./my-sketch" or "my-sketch")';
      }

      // Check for invalid characters
      if (/[<>:"|?*]/.test(trimmed)) {
        return 'Path contains invalid characters';
      }

      return;
    }
  });
}

/**
 * Run the full interactive prompt flow and return a structured options object
 * @param {string[]} versions - Available versions (descending order)
 * @param {string} latest - Latest version string
 * @returns {Promise<{projectPath:string,template:string,mode:string,version:string}>}
 */
export async function runInteractivePrompts(versions, latest) {
  const projectPath = await promptProjectPath();
  const template = await selectTemplate();
  const mode = await selectMode();
  const version = await selectVersion(versions, latest);

  return {
    projectPath: projectPath.trim() || '.',
    template,
    mode,
    version
  };
}
