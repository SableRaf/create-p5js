/**
 * Update module - Handles version updates and mode switching for existing p5.js projects
 * Philosophy: Business logic only, NO inline copy
 * All UI text comes from i18n layer
 */

import path from 'path';
import fs from 'fs/promises';
import minimist from 'minimist';
import { readConfig, createConfig } from '../config.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from '../version.js';
import { injectP5Script } from '../htmlManager.js';
import { createDirectory, readFile, writeFile, fileExists, removeDirectory } from '../utils.js';

// i18n
import { t } from '../i18n/index.js';

// UI primitives
import * as display from '../ui/display.js';
import * as prompts from '../ui/prompts.js';

/**
 * Main update function - Entry point for updating existing projects
 * Detects existing project and shows current state
 * @param {string} [projectDir=process.cwd()] - The directory of the project to update
 * @returns {Promise<void>}
 */
export async function update(projectDir = process.cwd()) {
  // Parse CLI arguments for options
  const args = minimist(process.argv.slice(2), {
    boolean: ['include-prerelease'],
    alias: {
      p: 'include-prerelease'
    }
  });

  const configPath = path.join(projectDir, '.p5-config.json');
  const oldConfigPath = path.join(projectDir, 'p5-config.json');

  // Check for old config file and migrate if found (show warning later)
  let didMigrate = false;
  if (await fileExists(oldConfigPath)) {
    await fs.rename(oldConfigPath, configPath);
    didMigrate = true;
  }

  // Read existing configuration
  const config = await readConfig(configPath);

  if (!config) {
    display.error('error.update.noConfig');
    process.exit(1);
    return; // defensive: ensure function doesn't continue if exit is mocked
  }

  // Display current project state
  if (config) {
    const configLines = [
      'note.update.currentConfig.version',
      'note.update.currentConfig.mode',
      'note.update.currentConfig.template',
      config.typeDefsVersion ? 'note.update.currentConfig.types' : 'note.update.currentConfig.typesNone',
      'note.update.currentConfig.lastUpdated'
    ];
    display.note(configLines, 'note.update.currentConfig.title', {
      version: config.version,
      mode: config.mode,
      template: config.template,
      types: config.typeDefsVersion,
      timestamp: config.lastUpdated
    });
  }

  // Show migration warning after config display (more visible)
  if (didMigrate) {
    display.warn('info.update.migratedConfig');
  }

  // Show update options
  const action = await prompts.promptUpdateAction();

  if (action === 'cancel') {
    display.info('info.update.cancelled');
    return;
  }

  // Route to appropriate update function
  if (action === 'version') {
    await updateVersion(projectDir, config, { includePrerelease: args['include-prerelease'] });
  } else if (action === 'mode') {
    await switchMode(projectDir, config);
  }
}

/**
 * Updates the p5.js version in an existing project
 * Handles both CDN and local delivery modes
 * @param {string} projectDir - The directory of the project to update
 * @param {Object} config - Current project configuration from p5-config.json
 * @param {Object} [options={}] - Update options
 * @param {boolean} [options.includePrerelease=false] - Whether to include pre-release versions
 * @returns {Promise<void>}
 */
async function updateVersion(projectDir, config, options = {}) {
  const { includePrerelease = false, verbose = false } = options;

  // Fetch available versions
  const { latest, versions } = await fetchVersions(includePrerelease);

  if (includePrerelease && verbose) {
    display.info('info.includePrerelease');
  }

  // Let user select new version
  const newVersion = await prompts.promptVersion(versions, latest);

  if (newVersion === config.version) {
    display.info('info.update.sameVersion');
    return;
  }

  if (verbose) {
    display.info('info.update.updating', { oldVersion: config.version, newVersion });
  }

  // Update based on delivery mode
  if (config.mode === 'local') {
    // Re-download p5.js files for local mode
    const libPath = path.join(projectDir, 'lib');
    await createDirectory(libPath);
    await downloadP5Files(newVersion, libPath);
    if (verbose) {
      display.success('info.update.downloadedFiles');
    }
  }

  // Update script tag in index.html (works for both CDN and local)
  const indexPath = path.join(projectDir, 'index.html');
  const htmlContent = await readFile(indexPath);
  const updatedHtml = injectP5Script(htmlContent, newVersion, config.mode);
  await writeFile(indexPath, updatedHtml);
  if (verbose) {
    display.success('info.update.updatedScript');
  }

  // Update TypeScript definitions
  const typesPath = path.join(projectDir, 'types');
  await createDirectory(typesPath);
  const typeDefsVersion = await downloadTypeDefinitions(newVersion, typesPath, null, config.template, config.version);
  if (verbose && typeDefsVersion) {
    display.success('info.update.updatedTypes', { version: typeDefsVersion });
  }

  // Update .p5-config.json
  const configPath = path.join(projectDir, '.p5-config.json');
  await createConfig(configPath, {
    version: newVersion,
    mode: config.mode,
    template: config.template,
    typeDefsVersion
  });

  const summaryLines = [
    'note.update.versionSummary.oldVersion',
    'note.update.versionSummary.newVersion',
    'note.update.versionSummary.types'
  ];
  display.note(summaryLines, 'note.update.versionSummary.title', {
    oldVersion: config.version,
    newVersion: newVersion,
    types: typeDefsVersion
  });

  display.outro(t('note.success.updated'));
}

/**
 * Switches delivery mode between CDN and local
 * @param {string} projectDir - The directory of the project to update
 * @param {Object} config - Current project configuration from p5-config.json
 * @param {Object} [options={}] - Update options
 * @param {boolean} [options.verbose=false] - Whether to show verbose output
 * @returns {Promise<void>}
 */
async function switchMode(projectDir, config, options = {}) {
  const { verbose = false } = options;
  const currentMode = config.mode;
  const newMode = currentMode === 'cdn' ? 'local' : 'cdn';

  if (verbose) {
    display.info('info.update.switchingMode', { oldMode: currentMode, newMode });
  }

  if (newMode === 'local') {
    // CDN → Local: Download files and update script tag
    const libPath = path.join(projectDir, 'lib');
    await createDirectory(libPath);
    await downloadP5Files(config.version, libPath);
    if (verbose) {
      display.success('info.update.downloadedFiles');
    }

    // Update .gitignore to exclude lib/ directory
    const gitignorePath = path.join(projectDir, '.gitignore');
    let gitignoreContent = '';
    if (await fileExists(gitignorePath)) {
      gitignoreContent = await readFile(gitignorePath);
    }

    // Only add lib/ if not already present
    if (!gitignoreContent.includes('lib/')) {
      await writeFile(gitignorePath, gitignoreContent + '\n# Local p5.js files\nlib/\n');
      if (verbose) {
        display.success('info.update.updatedGitignore');
      }
    }
  } else {
    // Local → CDN: Prompt user about lib/ directory
    const shouldDelete = await prompts.confirmDeleteLib();

    if (shouldDelete) {
      const libPath = path.join(projectDir, 'lib');
      try {
        await removeDirectory(libPath);
        if (verbose) {
          display.success('info.update.deletedLib');
        }
      } catch (error) {
        display.info('info.update.libNotFound');
      }
    } else {
      display.info('info.update.libKept');
    }
  }

  // Update script tag in index.html
  const indexPath = path.join(projectDir, 'index.html');
  const htmlContent = await readFile(indexPath);
  const updatedHtml = injectP5Script(htmlContent, config.version, newMode);
  await writeFile(indexPath, updatedHtml);
  if (verbose) {
    display.success('info.update.updatedScript');
  }

  // Update .p5-config.json
  const configPath = path.join(projectDir, '.p5-config.json');
  await createConfig(configPath, {
    version: config.version,
    mode: newMode,
    template: config.template,
    typeDefsVersion: config.typeDefsVersion
  });

  display.success('info.update.modeUpdated', { oldMode: currentMode, newMode });

  display.outro(t('note.success.updated'));
}
