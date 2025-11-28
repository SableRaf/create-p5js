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
import { update } from './src/update.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    boolean: ['yes', 'git', 'no-types', 'help'],
    string: ['template', 'version', 'mode'],
    alias: {
      y: 'yes',
      g: 'git',
      t: 'template',
      v: 'version',
      m: 'mode',
      h: 'help'
    }
  });

  const command = args._[0];

  // Handle --help flag
  if (args.help) {
    console.log(`
create-p5 - Scaffolding tool for p5.js projects

USAGE:
  npm create p5@latest [project-name] [options]
  npx create-p5 [project-name] [options]
  npx create-p5 update

OPTIONS:
  -t, --template <name>    Template to use (basic, instance, typescript, empty)
  -v, --version <version>  p5.js version to use (e.g., 2.1.1 or latest)
  -m, --mode <mode>        Delivery mode (cdn or local)
  -g, --git                Initialize git repository
  -y, --yes                Skip prompts and use defaults
      --no-types           Skip TypeScript definitions download
  -h, --help               Show this help message

EXAMPLES:
  npm create p5@latest my-sketch
  npm create p5@latest my-sketch -- --template typescript --mode cdn --git
  npm create p5@latest -- --yes
  npx create-p5 update
`);
    process.exit(0);
  }

  // Handle 'update' command explicitly
  if (command === 'update') {
    await update();
    return;
  }

  const projectName = command || 'my-sketch';

  // Check if we're in an existing p5.js project (but not if running 'update' command)
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

    // Determine template (flag or prompt)
    let selectedTemplate;
    if (args.template) {
      const validTemplates = ['basic', 'instance', 'typescript', 'empty'];
      if (!validTemplates.includes(args.template)) {
        console.error(`Error: Invalid template "${args.template}". Valid templates: ${validTemplates.join(', ')}`);
        process.exit(1);
      }
      selectedTemplate = args.template;
      console.log(`Using template: ${selectedTemplate}`);
    } else if (args.yes) {
      selectedTemplate = 'basic';
      console.log('Using default template: basic');
    } else {
      selectedTemplate = await selectTemplate();
    }

    // Determine version (flag or prompt)
    let selectedVersion;
    if (args.version) {
      if (args.version === 'latest') {
        selectedVersion = latest;
      } else if (!versions.includes(args.version)) {
        console.error(`Error: Version "${args.version}" not found. Use "latest" or a specific version like "2.1.1"`);
        process.exit(1);
      } else {
        selectedVersion = args.version;
      }
      console.log(`Using p5.js version: ${selectedVersion}`);
    } else if (args.yes) {
      selectedVersion = latest;
      console.log(`Using latest p5.js version: ${latest}`);
    } else {
      selectedVersion = await selectVersion(versions, latest);
    }

    // Determine delivery mode (flag or prompt)
    let selectedMode;
    if (args.mode) {
      const validModes = ['cdn', 'local'];
      if (!validModes.includes(args.mode)) {
        console.error(`Error: Invalid mode "${args.mode}". Valid modes: ${validModes.join(', ')}`);
        process.exit(1);
      }
      selectedMode = args.mode;
      console.log(`Using delivery mode: ${selectedMode}`);
    } else if (args.yes) {
      selectedMode = 'cdn';
      console.log('Using default delivery mode: cdn');
    } else {
      selectedMode = await selectMode();
    }

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
    let typeDefsVersion = null;
    if (!args['no-types']) {
      const typesPath = path.join(targetPath, 'types');
      await fs.mkdir(typesPath, { recursive: true });
      typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath);
    } else {
      console.log('Skipping TypeScript definitions download (--no-types flag)');
    }

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
