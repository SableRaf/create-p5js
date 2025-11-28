#!/usr/bin/env node

/**
 * create-p5 - Scaffolding tool for p5.js projects
 * Entry point for the CLI
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import minimist from 'minimist';
import { copyTemplateFiles } from './src/utils.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from './src/version.js';
import { selectVersion, selectMode, selectTemplate } from './src/prompts.js';
import { injectP5Script } from './src/template.js';
import { createConfig, configExists } from './src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2));
  const projectName = args._[0] || 'my-sketch';

  // Check if we're in an existing p5.js project
  const currentConfigPath = path.join(process.cwd(), 'p5-config.json');
  if (await configExists(currentConfigPath)) {
    console.log('Existing p5.js project detected (p5-config.json found).');
    console.log('This directory is already a create-p5 project.');
    console.log('\nTo update this project, use:');
    console.log('  npx create-p5 update');
    process.exit(0);
  }

  console.log('Welcome to create-p5!');
  console.log(`Creating project: ${projectName}`);

  try {
    // Fetch available p5.js versions
    console.log('Fetching p5.js versions...');
    const { latest, versions } = await fetchVersions();

    // Prompt user to select template
    const selectedTemplate = await selectTemplate();

    // Prompt user to select version
    const selectedVersion = await selectVersion(versions, latest);

    // Prompt user to select delivery mode
    const selectedMode = await selectMode();

    // Set up paths based on selected template
    const templatePath = path.join(__dirname, 'templates', selectedTemplate);
    const targetPath = path.join(process.cwd(), projectName);

    // Check if directory already exists
    try {
      await fs.access(targetPath);
      console.error(`Error: Directory "${projectName}" already exists.`);
      process.exit(1);
    } catch {
      // Directory doesn't exist, continue
    }

    // Copy template files
    await copyTemplateFiles(templatePath, targetPath);

    // If local mode, create lib directory and download p5.js files
    if (selectedMode === 'local') {
      const libPath = path.join(targetPath, 'lib');
      await fs.mkdir(libPath, { recursive: true });
      await downloadP5Files(selectedVersion, libPath);

      // Update .gitignore to exclude lib/ directory in local mode
      const gitignorePath = path.join(targetPath, '.gitignore');
      let gitignoreContent = '';
      try {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      } catch {
        // .gitignore doesn't exist, start with empty content
      }
      await fs.writeFile(gitignorePath, gitignoreContent + '\n# Local p5.js files\nlib/\n', 'utf-8');
    }

    // Inject p5.js script tag into index.html
    const indexPath = path.join(targetPath, 'index.html');
    const htmlContent = await fs.readFile(indexPath, 'utf-8');
    const updatedHtml = injectP5Script(htmlContent, selectedVersion, selectedMode);
    await fs.writeFile(indexPath, updatedHtml, 'utf-8');

    // Download TypeScript definitions for IntelliSense (all templates)
    const typesPath = path.join(targetPath, 'types');
    await fs.mkdir(typesPath, { recursive: true });
    const typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath);

    // Create p5-config.json in project root
    const configPath = path.join(targetPath, 'p5-config.json');
    await createConfig(configPath, {
      version: selectedVersion,
      mode: selectedMode,
      template: selectedTemplate,
      typeDefsVersion
    });

    console.log(`✓ Project created successfully!`);
    console.log(`  p5.js version: ${selectedVersion}`);
    console.log(`  Template: ${selectedTemplate}`);
    console.log(`  Mode: ${selectedMode}`);
    console.log(`  TypeScript definitions: ${typeDefsVersion}`);
    console.log(`  Config: p5-config.json created`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  Open index.html in your browser`);
  } catch (error) {
    console.error('Error creating project:', error.message);
    process.exit(1);
  }
}

main();
