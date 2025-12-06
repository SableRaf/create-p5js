/**
 * Prompt primitives - Interactive input functions
 * Philosophy: Mechanisms only, content from i18n
 * All text comes from locale files
 */

import * as p from '@clack/prompts';
import { t } from '../i18n/index.js';

/**
 * Check if user cancelled a prompt
 * @param {any} value - The prompt response value
 * @returns {boolean} True if cancelled
 */
export function isCancel(value) {
  return p.isCancel(value);
}

/**
 * Prompt for project path
 * @param {string} initialValue - Initial/default value
 * @returns {Promise<string>} User's input
 */
export async function promptProjectPath(initialValue) {
  return await p.text({
    message: t('prompt.projectPath.message'),
    placeholder: t('prompt.projectPath.placeholder'),
    initialValue,
    validate: (value) => {
      const trimmed = value.trim();

      // Allow current directory
      if (trimmed === '.' || trimmed === '') {
        return;
      }

      // Enforce relative paths
      if (trimmed.startsWith('/') || /^[A-Za-z]:/.test(trimmed)) {
        return t('prompt.projectPath.error.absolutePath');
      }

      // Check for invalid characters
      if (/[<>:"|?*]/.test(trimmed)) {
        return t('prompt.projectPath.error.invalidChars');
      }
    }
  });
}

/**
 * Prompt for template selection
 * @returns {Promise<string>} Selected template value
 */
export async function promptTemplate() {
  return await p.select({
    message: t('prompt.template.message'),
    options: [
      {
        value: 'basic',
        label: t('prompt.template.option.basic.label'),
        hint: t('prompt.template.option.basic.hint')
      },
      {
        value: 'instance',
        label: t('prompt.template.option.instance.label'),
        hint: t('prompt.template.option.instance.hint')
      },
      {
        value: 'typescript',
        label: t('prompt.template.option.typescript.label'),
        hint: t('prompt.template.option.typescript.hint')
      },
      {
        value: 'empty',
        label: t('prompt.template.option.empty.label'),
        hint: t('prompt.template.option.empty.hint')
      }
    ]
  });
}

/**
 * Prompt for version selection
 * @param {string[]} versions - Available versions
 * @param {string} latest - Latest version
 * @returns {Promise<string>} Selected version
 */
export async function promptVersion(versions, latest) {
  return await p.select({
    message: t('prompt.version.message'),
    options: versions.map(v => ({
      value: v,
      label: v === latest ? t('prompt.version.latestLabel', { version: v }) : v
    })),
    maxItems: 7
  });
}

/**
 * Prompt for delivery mode selection
 * @returns {Promise<string>} Selected mode ('cdn' or 'local')
 */
export async function promptMode() {
  return await p.select({
    message: t('prompt.mode.message'),
    options: [
      {
        value: 'cdn',
        label: t('prompt.mode.option.cdn.label'),
        hint: t('prompt.mode.option.cdn.hint')
      },
      {
        value: 'local',
        label: t('prompt.mode.option.local.label'),
        hint: t('prompt.mode.option.local.hint')
      }
    ]
  });
}

/**
 * Prompt for update action selection
 * @returns {Promise<string>} Selected action ('version', 'mode', or 'cancel')
 */
export async function promptUpdateAction() {
  return await p.select({
    message: t('prompt.update.action.message'),
    options: [
      {
        value: 'version',
        label: t('prompt.update.action.option.version.label'),
        hint: t('prompt.update.action.option.version.hint')
      },
      {
        value: 'mode',
        label: t('prompt.update.action.option.mode.label'),
        hint: t('prompt.update.action.option.mode.hint')
      },
      {
        value: 'cancel',
        label: t('prompt.update.action.option.cancel.label'),
        hint: t('prompt.update.action.option.cancel.hint')
      }
    ]
  });
}

/**
 * Confirm deletion of lib directory
 * @returns {Promise<boolean>} User's confirmation
 */
export async function confirmDeleteLib() {
  return await p.confirm({
    message: t('prompt.update.deleteLib.message'),
    initialValue: false
  });
}
