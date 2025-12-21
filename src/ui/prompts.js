/**
 * Prompt primitives - Interactive input functions
 * Philosophy: Mechanisms only, content from i18n
 * All text comes from locale files
 */

import * as p from '@clack/prompts';
import { t } from '../i18n/index.js';
import { isValidPathName } from '../utils.js';

/** @typedef {import('../types.js').CliArgs} CliArgs */
/** @typedef {import('../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../types.js').Language} Language */
/** @typedef {import('../types.js').P5Mode} P5Mode */
/** @typedef {import('../types.js').SetupType} SetupType */

/**
 * Check if user cancelled a prompt
 * @param {any} value - The prompt response value
 * @returns {value is symbol} True if cancelled
 */
export function isCancel(value) {
  return p.isCancel(value);
}

/**
 * Prompt for project path
 * @param {string} initialValue - Initial/default value
 * @returns {Promise<string | symbol>} User's input
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

      // Check for invalid path name with detailed error messages
      const errorKey = isValidPathName(trimmed);
      if (errorKey) {
        return t(errorKey);
      }
    }
  });
}

/**
 * Prompt for setup type selection
 * @returns {Promise<SetupType|symbol>} Selected setup type ('basic', 'standard', or 'custom')
 */
export async function promptSetupType() {
  const result = await p.select({
    message: t('prompt.setupType.message'),
    options: [
      {
        value: 'basic',
        label: t('prompt.setupType.option.basic.label'),
        hint: t('prompt.setupType.option.basic.hint')
      },
      {
        value: 'standard',
        label: t('prompt.setupType.option.standard.label'),
        hint: t('prompt.setupType.option.standard.hint')
      },
      {
        value: 'custom',
        label: t('prompt.setupType.option.custom.label'),
        hint: t('prompt.setupType.option.custom.hint')
      }
    ]
  });
  return result;
}

/**
 * Prompt for language selection
 * @returns {Promise<Language | symbol>} Selected language
 */
export async function promptLanguage() {
  return await p.select({
    message: t('prompt.languageMode.group.language.label'),
    options: [
      {
        value: 'javascript',
        label: t('prompt.languageMode.option.javascript.label'),
        hint: t('prompt.languageMode.option.javascript.hint')
      },
      {
        value: 'typescript',
        label: t('prompt.languageMode.option.typescript.label'),
        hint: t('prompt.languageMode.option.typescript.hint')
      }
    ]
  });
}

/**
 * Prompt for p5.js mode selection
 * @returns {Promise<P5Mode | symbol>} Selected mode ('global' or 'instance')
 */
export async function promptP5Mode() {
  return await p.select({
    message: t('prompt.languageMode.group.mode.label'),
    options: [
      {
        value: 'global',
        label: t('prompt.languageMode.option.global.label'),
        hint: t('prompt.languageMode.option.global.hint')
      },
      {
        value: 'instance',
        label: t('prompt.languageMode.option.instance.label'),
        hint: t('prompt.languageMode.option.instance.hint')
      }
    ]
  });
}

/**
 * Prompt for language and mode selection using two separate prompts
 * @returns {Promise<symbol | [Language, P5Mode]>} Array of selected values: ['javascript'|'typescript', 'global'|'instance']
 */
export async function promptLanguageAndMode() {
  const language = await promptLanguage();
  if (isCancel(language)) {
    return language; // Return the cancel symbol
  }

  const mode = await promptP5Mode();
  if (isCancel(mode)) {
    return mode; // Return the cancel symbol
  }

  return [language, mode];
}

/**
 * Prompt for version selection
 * @param {string[]} versions - Available versions
 * @param {string} latest - Latest version
 * @returns {Promise<string | symbol>} Selected version
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
 * @returns {Promise<DeliveryMode | symbol>} Selected mode ('cdn' or 'local')
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
 * @returns {Promise<string | symbol>} Selected action ('version', 'mode', or 'cancel')
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
 * @returns {Promise<boolean | symbol>} User's confirmation
 */
export async function confirmDeleteLib() {
  return await p.confirm({
    message: t('prompt.update.deleteLib.message'),
    initialValue: false
  });
}
