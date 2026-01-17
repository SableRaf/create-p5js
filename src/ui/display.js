/**
 * Display primitives - UI output functions
 * Philosophy: Mechanisms only, content from i18n
 * Applies formatting (colors) but no hardcoded text
 */

import * as p from '@clack/prompts';
import { blue, red, green, cyan, bgMagenta, white, gray } from 'kolorist';
import { t } from '../i18n/index.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);
const VERSION = packageJson.version;

let silentModeEnabled = false;

const SUPPRESSIBLE_TYPES = new Set([
  'intro',
  'outro',
  'cancel',
  'message',
  'info',
  'success',
  'note',
  'spinner'
]);

/**
 * Determine if output should be suppressed based on silent mode settings.
 * Errors (and warnings) should always be shown so users can diagnose failures.
 *
 * @param {string} type - Type of message being displayed
 * @returns {boolean} Whether the message should be suppressed
 */
function shouldSuppress(type) {
  if (!silentModeEnabled) {
    return false;
  }

  return SUPPRESSIBLE_TYPES.has(type);
}

/**
 * Enable or disable silent mode for non-critical display output.
 *
 * @param {boolean} enabled - Whether to silence informational output
 */
export function setSilentMode(enabled) {
  silentModeEnabled = Boolean(enabled);
}

/**
 * Show intro banner with branding
 */
export function intro() {
  if (shouldSuppress('intro')) {
    return;
  }
  p.intro(bgMagenta(white(t('cli.intro'))) + ' ' + gray(`v${VERSION}`));
}

/**
 * Show outro message and exit with specified code.
 *
 * @param {string} message - The outro message (already translated)
 * @param {number} [exitCode=0] - Exit code to use when terminating
 */
export function outro(message, exitCode = 0) {
  if (shouldSuppress('outro')) {
    process.exit(exitCode);
    return;
  }
  p.outro(message);
  process.exit(exitCode);
}

/**
 * Show cancellation message and exit
 * @param {string} key - Translation key for cancellation message
 */
export function cancel(key) {
  if (shouldSuppress('cancel')) {
    process.exit(0);
    return;
  }
  p.cancel(t(key));
  process.exit(0);
}

/**
 * Log a plain message (no formatting)
 * @param {string} text - Pre-formatted text (can include colors)
 */
export function message(text) {
  if (shouldSuppress('message')) {
    return;
  }
  p.log.message(text);
}

/**
 * Log an info message
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function info(key, vars) {
  if (shouldSuppress('info')) {
    return;
  }
  p.log.info(t(key, vars));
}

/**
 * Log a success message with green color
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function success(key, vars) {
  if (shouldSuppress('success')) {
    return;
  }
  p.log.success(t(key, vars));
}

/**
 * Log an error message with red color
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function error(key, vars) {
  p.log.error(t(key, vars));
}

/**
 * Log a warning message
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function warn(key, vars) {
  p.log.warn(t(key, vars));
}

/**
 * Display a note box with title and lines
 * @param {string[]} lineKeys - Array of translation keys for content lines
 * @param {string} titleKey - Translation key for title
 * @param {Record<string, any>} [vars] - Variables for interpolation (applied to all)
 */
export function note(lineKeys, titleKey, vars = {}) {
  if (shouldSuppress('note')) {
    return;
  }
  const content = lineKeys.map(key => t(key, vars)).join('\n');
  const title = t(titleKey);
  p.note(content, title);
}

/**
 * Create and manage a spinner
 * @param {string} key - Translation key for initial message
 * @param {Record<string, any>} [vars] - Variables for interpolation
 * @returns {Object} Spinner object with message(key, vars) and stop(key, vars) methods
 */
export function spinner(key, vars) {
  if (shouldSuppress('spinner')) {
    return {
      message: () => {},
      stop: () => {}
    };
  }
  const s = p.spinner();
  s.start(t(key, vars));

  // Wrap methods to use translation keys
  const originalMessage = s.message.bind(s);
  const originalStop = s.stop.bind(s);

  s.message = (key, vars) => originalMessage(t(key, vars));
  s.stop = (key, vars) => originalStop(t(key, vars));

  return s;
}

/**
 * Apply blue color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleBlue(text) {
  return blue(text);
}

/**
 * Apply green color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleGreen(text) {
  return green(text);
}

/**
 * Apply red color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleRed(text) {
  return red(text);
}

/**
 * Apply cyan color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleCyan(text) {
  return cyan(text);
}
