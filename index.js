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
import { fetchVersions } from './src/version.js';
import { selectVersion } from './src/prompts.js';
import { injectP5Script } from './src/template.js';
import { createConfig } from './src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2));
  const projectName = args._[0] || 'my-sketch';

  const templatePath = path.join(__dirname, 'templates', 'basic');
  const targetPath = path.join(process.cwd(), projectName);

  console.log('Welcome to create-p5!');
  console.log(`Creating project: ${projectName}`);

  // Check if directory already exists
  try {
    await fs.access(targetPath);
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  } catch {
    // Directory doesn't exist, continue
  }

  try {
    // Fetch available p5.js versions
    console.log('Fetching p5.js versions...');
    const { latest, versions } = await fetchVersions();

    // Prompt user to select version
    const selectedVersion = await selectVersion(versions, latest);

    // Copy template files
    await copyTemplateFiles(templatePath, targetPath);

    // Inject p5.js script tag into index.html
    const indexPath = path.join(targetPath, 'index.html');
    const htmlContent = await fs.readFile(indexPath, 'utf-8');
    const updatedHtml = injectP5Script(htmlContent, selectedVersion);
    await fs.writeFile(indexPath, updatedHtml, 'utf-8');

    // Create p5-config.json in project root
    const configPath = path.join(targetPath, 'p5-config.json');
    await createConfig(configPath, {
      version: selectedVersion,
      mode: 'cdn',
      template: 'basic'
    });

    console.log(`✓ Project created successfully!`);
    console.log(`  p5.js version: ${selectedVersion}`);
    console.log(`  Template: basic`);
    console.log(`  Mode: cdn`);
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
