/**
 * Utility functions for file operations and validation
 */

import fs from 'fs/promises';
import path from 'path';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

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
 * Rename/move a single file from source to destination
 * @param {string} sourcePath
 * @param {string} destPath
 */
export async function renameFile(sourcePath, destPath) {
  await fs.rename(sourcePath, destPath);
}

/**
 * Delete file at given path
 * @param {string} targetFilePath
 */
export async function deleteFile(targetFilePath) {
  await fs.unlink(targetFilePath);
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
 * Validates a project path for creating a new project.
 * Enforces relative paths only and checks for invalid characters.
 *
 * @param {string|number} projectPath - The project path to validate (converted to string if needed)
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateProjectPath(projectPath) {
  // Convert to string to handle numeric inputs (e.g., "1234" parsed as number by minimist)
  const trimmed = String(projectPath).trim();

  // Allow current directory
  if (trimmed === '.' || trimmed === '') {
    return null;
  }

  // Enforce relative paths (no absolute paths)
  if (trimmed.startsWith('/') || /^[A-Za-z]:/.test(trimmed)) {
    return 'Please use a relative path (e.g., "./my-sketch" or "my-sketch")';
  }

  // Check for invalid characters
  if (/[<>:"|?*]/.test(trimmed)) {
    return 'Path contains invalid characters';
  }

  return null;
}

/**
 * Validates a project name according to npm naming conventions.
 * Returns an error message if invalid, or null if valid.
 *
 * @param {string|number} name - The project name to validate (converted to string if needed)
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateProjectName(name) {
  // Convert to string to handle numeric inputs (e.g., "1234" parsed as number by minimist)
  const nameStr = String(name);

  if (!nameStr || nameStr.trim() === '') {
    return 'Project name cannot be empty';
  }

  const trimmed = nameStr.trim();

  // Check for spaces
  if (trimmed.includes(' ')) {
    return 'Project name cannot contain spaces. Use hyphens or underscores instead (e.g., "my-sketch")';
  }

  // Check for invalid characters (only allow alphanumeric, hyphen, underscore, dot)
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return 'Project name can only contain letters, numbers, hyphens, underscores, and dots';
  }

  // Check if starts with dot or hyphen
  if (trimmed.startsWith('.') || trimmed.startsWith('-')) {
    return 'Project name cannot start with a dot or hyphen';
  }

  // Check for reserved names
  const reservedNames = ['node_modules', 'package.json', 'package-lock.json'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return `"${trimmed}" is a reserved name and cannot be used`;
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
 * Checks if a template spec represents a remote template (GitHub repo)
 *
 * @param {string} template - The template spec to check
 * @returns {boolean} True if remote template, false otherwise
 */
export function isRemoteTemplateSpec(template) {
  if (typeof template !== 'string') return false;

  // Full URL
  if (/^https?:\/\//.test(template)) return true;

  // GitHub shorthand (user/repo or user/repo/subdir) contains a slash
  if (/^[^\s]+\/[^\s]+/.test(template)) return true;

  return false;
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
 * Validates language choice
 * @param {string} language - Language to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateLanguage(language) {
  const valid = ['javascript', 'typescript'];
  if (!valid.includes(language)) {
    return `Invalid language: ${language}. Must be one of: ${valid.join(', ')}`;
  }
  return null;
}

/**
 * Validates p5.js mode choice
 * @param {string} mode - Mode to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateP5Mode(mode) {
  const valid = ['global', 'instance'];
  if (!valid.includes(mode)) {
    return `Invalid mode: ${mode}. Must be one of: ${valid.join(', ')}`;
  }
  return null;
}

/**
 * Validates setup type selections
 *
 * @param {string} type - Setup type to validate
 * @returns {string|null} Error message if invalid, null otherwise
 */
export function validateSetupType(type) {
  const validTypes = ['basic', 'standard', 'custom'];
  if (!validTypes.includes(type)) {
    return `Invalid setup type: ${type}. Must be one of: ${validTypes.join(', ')}`;
  }
  return null;
}

/**
 * Determines template directory name from language and mode
 * @param {'javascript' | 'typescript'} language
 * @param {'global' | 'instance'} mode 
 * @returns {string} Template directory name (e.g., 'basic-global-js')
 */
export function getTemplateName(language, mode) {
  if (language === 'typescript'){
    return 'basic-ts';
  }
  
  return `basic-${mode}-js`;
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

/**
 * Generates a random, memorable project name using adjectives and animals
 * @returns {string} A random project name (e.g., 'brave-elephant', 'blue-tiger')
 */
export function generateProjectName() {
  const useColor = Math.random() < 0.5;
  const config = {
    dictionaries: useColor ? [colors, animals] : [adjectives, animals],
    separator: '-',
    style: 'lowerCase'
  };
  return uniqueNamesGenerator(config);
}

/**
 * Checks if a path name contains invalid characters.
 * Uses restrictions similar to Windows file naming conventions for cross-platform safety.
 *
 * @param {string} trimmedPath - The trimmed path name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function hasValidCharacters(trimmedPath) {
  return !/[<>:"|?*\/\\\x00-\x1f]/.test(trimmedPath);
}

/**
 * Checks if a path name doesn't end with whitespace or dot.
 *
 * @param {string} trimmedPath - The trimmed path name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function hasValidEnding(trimmedPath) {
  return !/[\s.]$/.test(trimmedPath);
}

/**
 * Checks if a path name is not a reserved Windows name.
 *
 * @param {string} trimmedPath - The trimmed path name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isNotReservedName(trimmedPath) {
  return !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(trimmedPath.split('.')[0]);
}

/**
 * Checks if a path name length is within limits.
 *
 * @param {string} trimmedPath - The trimmed path name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function hasValidLength(trimmedPath) {
  return trimmedPath.length <= 255;
}

/**
 * Validates a path name with detailed error messages.
 * Uses cross-platform file naming restrictions for maximum compatibility.
 *
 * @param {string} pathName - The path name to validate
 * @returns {string|null} Specific error message key if invalid, null if valid
 */
export function isValidPathName(pathName) {
  const trimmed = pathName.trim();

  // Check for invalid characters first (most common issue)
  if (!hasValidCharacters(trimmed)) {
    return 'prompt.projectPath.error.invalidChars';
  }

  // Check for invalid ending (dot or whitespace)
  if (!hasValidEnding(trimmed)) {
    return 'prompt.projectPath.error.invalidEnding';
  }

  // Check for reserved Windows names
  if (!isNotReservedName(trimmed)) {
    return 'prompt.projectPath.error.reservedName';
  }

  // Check length limit
  if (!hasValidLength(trimmed)) {
    return 'prompt.projectPath.error.tooLong';
  }

  return null; // Valid
}


/**
 * Returns the absolute path to the project folder
 * @param {string} cwdPath - absolute path of current working directory
 * @param {"." | string} projectPath - may be absolute or relative
 * @returns {string} fullTargetPath - absolute path for the project folder
 */
export function determineTargetPath(cwdPath, projectPath){
  if (projectPath==="."){
    return cwdPath;
  }
  
  // We'll pick path.win32 or path.posix explicitly when we're in unit testing
  // so we can test both sorts of paths on different OSes.
  //Otherwise, running unit tests on mac or *nix won't think the windows style 
  // c:\home\foo refers to an absolute path.    
  const isTest = process.env.NODE_ENV === 'test';
  const platformPath = !isTest ? path : getOSPlatformPathModuleBasedOnExamples([cwdPath, projectPath])

  if(platformPath.isAbsolute(projectPath)){
    return projectPath;  
  }
  
  //project path must be relative.  resolve it absolutely.
  return platformPath.join(cwdPath, projectPath);
}

/** Return path.win32 or path.posix by guessing based on the given array of example path strings. 
 * This is a guess but is only for use when unit testing.
 * @param {string[]} examplePaths
 * @returns {path.PlatformPath}
 */
function getOSPlatformPathModuleBasedOnExamples(examplePaths){
 return examplePaths.some(p => p.includes('\\') || p.includes(':'))
    ? path.win32 
    : path.posix;
}