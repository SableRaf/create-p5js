import fs from 'fs/promises';
import path from 'path';
import * as display from '../../ui/display.js';
import { determineTargetPath, directoryExists, validateProjectName } from '../../utils.js';

/**
 * normalises, validates paths
 * @param {string} projectPath 
 * @returns {Promise<{ targetPath: string, projectName: string }>}
 */
export async function stepDeterminePaths(projectPath) {
  projectPath = projectPath.trim() || '.';

  // Extract project name from path for display purposes
  const projectName = projectPath === '.' ? path.basename(process.cwd()) : path.basename(projectPath);

  // Validate project name
  const nameError = validateProjectName(projectName);
  if (nameError) {
    display.error('error.invalidProjectName');
    display.message(nameError);
    process.exit(1);
  }

  const targetPath = determineTargetPath(process.cwd(), projectPath);

  // Check if target directory already exists (unless it's current directory and empty)
  if (projectPath !== '.') {
    if (await directoryExists(targetPath)) {
      display.error('error.directoryExists', { path: projectPath });
      display.info('error.directoryExistsSuggestion');
      process.exit(1);
    }
  } else {
    // If creating in current directory, check if it's empty
    const files = await fs.readdir(targetPath);
    const hasRelevantFiles = files.some(f => !f.startsWith('.') && f !== 'node_modules');
    if (hasRelevantFiles) {
      display.error('error.currentDirNotEmpty');
      display.info('error.currentDirSuggestion');
      process.exit(1);
    }
  }

  if (projectPath === '.') {
    display.info('info.creatingInCurrent');
  } else {
    display.info('info.creatingIn', { path: projectPath });
  }
  return { targetPath, projectName };
}

