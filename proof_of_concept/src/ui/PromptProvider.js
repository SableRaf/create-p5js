// PromptProvider - Handles all user prompts and interactions
import * as p from '@clack/prompts';

const basePath = 'sketch/';

export class PromptProvider {
  /**
   * Displays an intro message at the start of the CLI interaction
   * @param {string} message - The intro message to display
   * @returns {void}
   */
  intro(message) {
    p.intro(message);
  }

  /**
   * Displays an outro message at the end of the CLI interaction
   * @param {string} message - The outro message to display
   * @returns {void}
   */
  outro(message) {
    p.outro(message);
  }

  /**
   * Displays a note message with an optional title
   * @param {string} message - The note message to display
   * @param {string} title - The title for the note
   * @returns {void}
   */
  note(message, title) {
    p.note(message, title);
  }

  /**
   * Displays a cancellation message
   * @param {string} message - The cancellation message to display
   * @returns {void}
   */
  cancel(message) {
    p.cancel(message);
  }

  /**
   * Checks if the user cancelled the prompt
   * @param {*} value - The value to check
   * @returns {boolean} True if the user cancelled, false otherwise
   */
  isCancel(value) {
    return p.isCancel(value);
  }

  /**
   * Displays a confirmation prompt
   * @param {string} message - The confirmation question to display
   * @returns {Promise<boolean>} The user's response (true/false)
   */
  async confirm(message) {
    return await p.confirm({ message });
  }

  /**
   * Displays a version selection prompt
   * @param {string[]} versions - Array of available version strings
   * @param {number} [count=15] - Maximum number of versions to display
   * @returns {Promise<string>} The selected version string
   */
  async selectVersion(versions, count = 15) {
    return await p.select({
      message: 'Select p5.js version:',
      options: versions.slice(0, count).map(v => ({ value: v, label: v })),
    });
  }

  /**
   * Displays a delivery mode selection prompt (CDN or Local)
   * @returns {Promise<string>} The selected mode: "cdn" or "local"
   */
  async selectMode() {
    return await p.select({
      message: 'Choose delivery mode:',
      options: [
        { value: 'cdn', label: 'CDN (jsdelivr)' },
        { value: 'local', label: `Local (download to ${basePath}lib/)` }
      ],
    });
  }

  /**
   * Displays a generic selection prompt
   * @param {string} message - The prompt message to display
   * @param {Array<{value: *, label: string}>} options - Array of option objects with value and label properties
   * @returns {Promise<*>} The selected option's value
   */
  async select(message, options) {
    return await p.select({ message, options });
  }
}

