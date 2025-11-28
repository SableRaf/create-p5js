/**
 * Update module - Handles version updates and mode switching for existing p5.js projects
 */

import path from 'path';
import { readConfig, createConfig } from './config.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from './version.js';
import { selectVersion } from './prompts.js';
import { injectP5Script } from './template.js';
import * as p from '@clack/prompts';
import { createDirectory, readFile, writeFile, fileExists, removeDirectory } from './utils.js';

/**
 * Main update function - Entry point for updating existing projects
 * Detects existing project and shows current state
 * @param {string} [projectDir=process.cwd()] - The directory of the project to update
 * @returns {Promise<void>}
 */
export async function update(projectDir = process.cwd()) {
  const configPath = path.join(projectDir, 'p5-config.json');

  // Read existing configuration
  const config = await readConfig(configPath);

  if (!config) {
    console.error('Error: No p5-config.json found. This does not appear to be a create-p5 project.');
    process.exit(1);
    return; // defensive: ensure function doesn't continue if exit is mocked
  }

  // Display current project state
  if (config) {
    console.log('Current project configuration:');
    console.log(`  p5.js version: ${config.version}`);
    console.log(`  Delivery mode: ${config.mode}`);
    console.log(`  Template: ${config.template}`);
    console.log(`  TypeScript definitions: ${config.typeDefsVersion || 'none'}`);
    console.log(`  Last updated: ${config.lastUpdated}`);
  }

  // Show update options
  const action = await p.select({
    message: 'What would you like to update?',
    options: [
      {
        value: 'version',
        label: 'Update p5.js version',
        hint: 'Change to a different version of p5.js'
      },
      {
        value: 'mode',
        label: 'Switch delivery mode',
        hint: 'Switch between CDN and local file delivery'
      },
      {
        value: 'cancel',
        label: 'Cancel',
        hint: 'Exit without making changes'
      }
    ]
  });

  if (action === 'cancel') {
    console.log('Update cancelled.');
    return;
  }

  // Route to appropriate update function
  if (action === 'version') {
    await updateVersion(projectDir, config);
  } else if (action === 'mode') {
    await switchMode(projectDir, config);
  }
}

/**
 * Updates the p5.js version in an existing project
 * Handles both CDN and local delivery modes
 * @param {string} projectDir - The directory of the project to update
 * @param {Object} config - Current project configuration from p5-config.json
 * @returns {Promise<void>}
 */
async function updateVersion(projectDir, config) {
  // Fetch available versions
  console.log('Fetching p5.js versions...');
  const { latest, versions } = await fetchVersions();

  // Let user select new version
  const newVersion = await selectVersion(versions, latest);

  if (newVersion === config.version) {
    console.log('Selected version is the same as current version. No changes made.');
    return;
  }

  console.log(`Updating from version ${config.version} to ${newVersion}...`);

  // Update based on delivery mode
  if (config.mode === 'local') {
    // Re-download p5.js files for local mode
    const libPath = path.join(projectDir, 'lib');
    await createDirectory(libPath);
    await downloadP5Files(newVersion, libPath);
    console.log('✓ Downloaded new p5.js files to lib/');
  }

  // Update script tag in index.html (works for both CDN and local)
  const indexPath = path.join(projectDir, 'index.html');
  const htmlContent = await readFile(indexPath);
  const updatedHtml = injectP5Script(htmlContent, newVersion, config.mode);
  await writeFile(indexPath, updatedHtml);
  console.log('✓ Updated script tag in index.html');

  // Update TypeScript definitions
  const typesPath = path.join(projectDir, 'types');
  await createDirectory(typesPath);
  const typeDefsVersion = await downloadTypeDefinitions(newVersion, typesPath);
  console.log(`✓ Updated TypeScript definitions to version ${typeDefsVersion}`);

  // Update p5-config.json
  const configPath = path.join(projectDir, 'p5-config.json');
  await createConfig(configPath, {
    version: newVersion,
    mode: config.mode,
    template: config.template,
    typeDefsVersion
  });

  console.log(`✓ Version updated successfully!`);
  console.log(`  Old version: ${config.version}`);
  console.log(`  New version: ${newVersion}`);
  console.log(`  TypeScript definitions: ${typeDefsVersion}`);
}

/**
 * Switches delivery mode between CDN and local
 * @param {string} projectDir - The directory of the project to update
 * @param {Object} config - Current project configuration from p5-config.json
 * @returns {Promise<void>}
 */
async function switchMode(projectDir, config) {
  const currentMode = config.mode;
  const newMode = currentMode === 'cdn' ? 'local' : 'cdn';

  console.log(`Switching from ${currentMode} to ${newMode} mode...`);

  if (newMode === 'local') {
    // CDN → Local: Download files and update script tag
    const libPath = path.join(projectDir, 'lib');
    await createDirectory(libPath);
    await downloadP5Files(config.version, libPath);
    console.log('✓ Downloaded p5.js files to lib/');

    // Update .gitignore to exclude lib/ directory
    const gitignorePath = path.join(projectDir, '.gitignore');
    let gitignoreContent = '';
    if (await fileExists(gitignorePath)) {
      gitignoreContent = await readFile(gitignorePath);
    }

    // Only add lib/ if not already present
    if (!gitignoreContent.includes('lib/')) {
      await writeFile(gitignorePath, gitignoreContent + '\n# Local p5.js files\nlib/\n');
      console.log('✓ Updated .gitignore to exclude lib/');
    }
  } else {
    // Local → CDN: Prompt user about lib/ directory
    const shouldDelete = await p.confirm({
      message: 'Delete the local lib/ directory?',
      initialValue: false
    });

    if (shouldDelete) {
      const libPath = path.join(projectDir, 'lib');
      try {
        await removeDirectory(libPath);
        console.log('✓ Deleted lib/ directory');
      } catch (error) {
        console.log('Note: lib/ directory not found or already deleted');
      }
    } else {
      console.log('Note: lib/ directory kept (you can delete it manually)');
    }
  }

  // Update script tag in index.html
  const indexPath = path.join(projectDir, 'index.html');
  const htmlContent = await readFile(indexPath);
  const updatedHtml = injectP5Script(htmlContent, config.version, newMode);
  await writeFile(indexPath, updatedHtml);
  console.log('✓ Updated script tag in index.html');

  // Update p5-config.json
  const configPath = path.join(projectDir, 'p5-config.json');
  await createConfig(configPath, {
    version: config.version,
    mode: newMode,
    template: config.template,
    typeDefsVersion: config.typeDefsVersion
  });

  console.log(`✓ Mode switched successfully!`);
  console.log(`  Old mode: ${currentMode}`);
  console.log(`  New mode: ${newMode}`);
}
