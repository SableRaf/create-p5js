/**
 * Utility functions for file operations and validation
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Copies all files from a template directory to a target directory.
 * Creates the target directory if it doesn't exist.
 *
 * @param {string} templatePath - Path to the template directory
 * @param {string} targetPath - Path to the target directory
 * @returns {Promise<void>}
 */
export async function copyTemplateFiles(templatePath, targetPath) {
  // Create target directory
  await fs.mkdir(targetPath, { recursive: true });

  // Read all files in template directory
  const files = await fs.readdir(templatePath);

  // Copy each file
  for (const file of files) {
    const sourcePath = path.join(templatePath, file);
    const destPath = path.join(targetPath, file);

    const stats = await fs.stat(sourcePath);

    if (stats.isDirectory()) {
      // Recursively copy subdirectories
      await copyTemplateFiles(sourcePath, destPath);
    } else {
      // Copy file
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

/**
 * Create a directory (recursive)
 * @param {string} dirPath
 */
export async function createDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Copy a single file from source to destination
 * @param {string} source
 * @param {string} dest
 */
export async function copyFile(source, dest) {
  await fs.copyFile(source, dest);
}

/**
 * Check if a file or directory exists
 * @param {string} pth
 * @returns {Promise<boolean>}
 */
export async function fileExists(pth) {
  try {
    await fs.stat(pth);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON file and parse it. Returns null on missing file.
 * @param {string} jsonPath
 * @returns {Promise<any|null>}
 */
export async function readJSON(jsonPath) {
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Write an object as JSON to a file with 2-space indent
 * @param {string} jsonPath
 * @param {any} obj
 */
export async function writeJSON(jsonPath, obj) {
  const content = JSON.stringify(obj, null, 2) + '\n';
  await fs.writeFile(jsonPath, content, 'utf-8');
}

/**
 * Convenience readFile wrapper
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function readFile(filePath) {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Convenience writeFile wrapper
 * @param {string} filePath
 * @param {string} content
 */
export async function writeFile(filePath, content) {
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Remove a directory recursively (safe)
 * @param {string} dirPath
 */
export async function removeDirectory(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

/**
 * Validates a project name according to npm naming conventions.
 * Returns an error message if invalid, or null if valid.
 *
 * @param {string} name - The project name to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return 'Project name cannot be empty';
  }

  // Check for spaces
  if (name.includes(' ')) {
    return 'Project name cannot contain spaces. Use hyphens or underscores instead (e.g., "my-sketch")';
  }

  // Check for invalid characters (only allow alphanumeric, hyphen, underscore, dot)
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, underscores, and dots';
  }

  // Check if starts with dot or hyphen
  if (name.startsWith('.') || name.startsWith('-')) {
    return 'Project name cannot start with a dot or hyphen';
  }

  // Check for reserved names
  const reservedNames = ['node_modules', 'package.json', 'package-lock.json'];
  if (reservedNames.includes(name.toLowerCase())) {
    return `"${name}" is a reserved name and cannot be used`;
  }

  return null; // Valid
}

/**
 * Checks if a directory already exists at the given path
 *
 * @param {string} dirPath - The directory path to check
 * @returns {Promise<boolean>} True if directory exists, false otherwise
 */
export async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Validates that a template name is one of the supported templates
 *
 * @param {string} template - The template name to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateTemplate(template) {
  const validTemplates = ['basic', 'instance', 'typescript', 'empty'];

  // Allow built-in templates
  if (validTemplates.includes(template)) return null;

  // Allow remote templates specified as GitHub shorthand (user/repo or user/repo/path)
  // or as full URLs (https://github.com/user/repo.git, etc.)
  try {
    if (typeof template === 'string') {
      // Full URL
      if (/^https?:\/\//.test(template)) return null;

      // GitHub shorthand (user/repo or user/repo/subdir) contains a slash
      if (/^[^\s]+\/[^^\s]+/.test(template)) return null;
    }
  } catch (e) {
    // fall through to error
  }

  return `Invalid template "${template}". Valid templates: ${validTemplates.join(', ')} or a GitHub repository (user/repo or URL)`;
}

/**
 * Validates that a delivery mode is either 'cdn' or 'local'
 *
 * @param {string} mode - The delivery mode to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateMode(mode) {
  const validModes = ['cdn', 'local'];
  if (!validModes.includes(mode)) {
    return `Invalid mode "${mode}". Valid modes: ${validModes.join(', ')}`;
  }
  return null;
}

/**
 * Validates that a version exists in the available versions list
 *
 * @param {string} version - The version to validate
 * @param {string[]} availableVersions - Array of available version strings
 * @param {string} latest - The latest version string
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateVersion(version, availableVersions, latest) {
  if (version === 'latest') {
    return null; // Valid, will be resolved to actual version
  }

  if (!availableVersions.includes(version)) {
    return `Version "${version}" not found. Use "latest" or a specific version like "${latest}"`;
  }

  return null;
}
