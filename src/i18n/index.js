/**
 * Internationalization (i18n) layer
 * Loads locale files and provides translation function
 *
 * Philosophy: Generic, reusable, no business logic
 * Format: JSON files with ICU-style interpolation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {Record<string, string>} */
let messages = {};

/** @type {string} */
let currentLocale = 'en';

/**
 * Load all translation files for a given locale
 * @param {string} locale - Locale code (e.g., 'en', 'fr', 'es')
 * @returns {Record<string, string>} All messages for this locale
 */
function loadMessages(locale) {
  const localeDir = path.join(__dirname, '..', '..', 'locales', locale);

  const result = {};

  // Fallback to English if locale directory doesn't exist
  if (!fs.existsSync(localeDir)) {
    if (locale !== 'en') {
      console.warn(`Locale ${locale} not found, falling back to English`);
      return loadMessages('en');
    }
    return {};
  }

  // Load all JSON files in the locale directory
  const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(localeDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);
      Object.assign(result, json);
    } catch (error) {
      console.error(`Failed to load ${filePath}:`, error.message);
    }
  }

  return result;
}

/**
 * Set the current locale and load its messages
 * @param {string} locale - Locale code (e.g., 'en', 'fr', 'es')
 */
export function setLocale(locale) {
  currentLocale = locale;
  messages = loadMessages(locale);
}

/**
 * Simple interpolation: replaces {name} with vars.name
 * @param {string} template - Template string with {placeholders}
 * @param {Record<string, any>} vars - Variables to interpolate
 * @returns {string} Interpolated string
 */
function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value == null ? match : String(value);
  });
}

/**
 * Translate a key with optional variable interpolation
 * @param {string} key - Translation key (e.g., 'cli.intro', 'error.notFound')
 * @param {Record<string, any>} [vars={}] - Variables for interpolation
 * @returns {string} Translated and interpolated string
 *
 * @example
 * t('error.directoryExists', { path: './my-sketch' })
 * // => "Directory "./my-sketch" already exists."
 *
 * @example
 * t('prompt.version.latestLabel', { version: '1.9.0' })
 * // => "1.9.0 (latest)"
 */
export function t(key, vars = {}) {
  const template = messages[key];

  if (!template) {
    console.warn(`Translation key not found: ${key}`);
    return key; // Return the key itself as fallback
  }

  return interpolate(template, vars);
}

/**
 * Get current locale
 * @returns {string} Current locale code
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Detect locale from environment variables
 * Checks LC_ALL, LC_MESSAGES, LANG in order
 * @returns {string} Detected locale code (defaults to 'en')
 */
export function detectLocale() {
  const env = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '';

  // Parse formats like: en_US.UTF-8 => en, fr_FR => fr, pt-BR => pt-BR
  const match = env.match(/^([a-z]{2})([_-][A-Z]{2})?/i);

  if (match) {
    return match[1].toLowerCase(); // Return just language code (en, fr, es, etc.)
  }

  return 'en';
}

// Initialize with detected or default locale
setLocale(detectLocale());
