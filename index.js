#!/usr/bin/env node

/**
 * create-p5 - Scaffolding tool for p5.js projects
 * Entry point for the CLI
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import minimist from 'minimist';
import * as p from '@clack/prompts';
import { green, red, blue, cyan } from 'kolorist';
import { copyTemplateFiles, validateProjectName, directoryExists, validateTemplate, validateMode, validateVersion } from './src/utils.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from './src/version.js';
import { selectVersion, selectMode, selectTemplate } from './src/prompts.js';
import { injectP5Script } from './src/template.js';
import { createConfig, configExists } from './src/config.js';
import { update } from './src/update.js';
import { initGit, addLibToGitignore } from './src/git.js';
import { isRemoteTemplateSpec, normalizeTemplateSpec, fetchTemplate } from './src/templateFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    boolean: ['yes', 'git', 'no-types', 'help', 'verbose'],
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
    p.log.message(`
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
      --verbose            Show detailed logging
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

  // Validate project name
  const nameError = validateProjectName(projectName);
  if (nameError) {
    p.log.error(nameError);
    process.exit(1);
  }

  // Check if we're in an existing p5.js project (but not if running 'update' command)
  const currentConfigPath = path.join(process.cwd(), 'p5-config.json');
  if (await configExists(currentConfigPath)) {
    p.log.info('Existing p5.js project detected (p5-config.json found).');
    p.log.info('This directory is already a create-p5 project.');
    p.log.message('');
    p.log.info('To update this project, use:');
    p.log.info('  npx create-p5 update');
    process.exit(0);
  }

  // Check if target directory already exists
  const targetPath = path.join(process.cwd(), projectName);
  if (await directoryExists(targetPath)) {
    p.log.error(`Directory "${projectName}" already exists.`);
    p.log.info(`Suggestion: Choose a different project name or remove the existing directory.`);
    process.exit(1);
  }

  p.intro(cyan('create-p5'));
  p.log.info(`Creating project: ${blue(projectName)}`);

  if (args.verbose) {
    p.log.info('Verbose mode enabled');
  }

  try {
    // Fetch available p5.js versions
    const s = p.spinner();
    s.start('Fetching p5.js versions');
    let latest, versions;
    try {
      ({ latest, versions } = await fetchVersions());
      s.stop(green('✓') + ' Fetched available versions');
    } catch (error) {
      s.stop(red('✗') + ' Failed to fetch versions');
      p.log.message('');
      p.log.error(error.message);
      p.log.message('');
      p.log.info('Troubleshooting:');
      p.log.info('  1. Check your internet connection');
      p.log.info('  2. Verify that https://data.jsdelivr.com is accessible');
      p.log.info('  3. Try again in a few moments');
      process.exit(1);
    }

    // Validate all flags immediately after fetching versions (before any prompts)
    if (args.template) {
      const templateError = validateTemplate(args.template);
      if (templateError) {
        throw new Error(templateError);
      }
    }

    if (args.version) {
      const versionError = validateVersion(args.version, versions, latest);
      if (versionError) {
        throw new Error(versionError);
      }
    }

    if (args.mode) {
      const modeError = validateMode(args.mode);
      if (modeError) {
        throw new Error(modeError);
      }
    }

    // Determine template (flag or prompt)
    let selectedTemplate;
    if (args.template) {
      selectedTemplate = args.template;
      p.log.success(`Using template: ${blue(selectedTemplate)}`);
    } else if (args.yes) {
      selectedTemplate = 'basic';
      p.log.success(`Using default template: ${blue('basic')}`);
    } else {
      selectedTemplate = await selectTemplate();
    }

    // Determine version (flag or prompt)
    let selectedVersion;
    if (args.version) {
      selectedVersion = args.version === 'latest' ? latest : args.version;
      p.log.success(`Using p5.js version: ${blue(selectedVersion)}`);
    } else if (args.yes) {
      selectedVersion = latest;
      p.log.success(`Using latest p5.js version: ${blue(latest)}`);
    } else {
      selectedVersion = await selectVersion(versions, latest);
    }

    // Determine delivery mode (flag or prompt)
    let selectedMode;
    if (args.mode) {
      selectedMode = args.mode;
      p.log.success(`Using delivery mode: ${blue(selectedMode)}`);
    } else if (args.yes) {
      selectedMode = 'cdn';
      p.log.success(`Using default delivery mode: ${blue('cdn')}`);
    } else {
      selectedMode = await selectMode();
    }

    // Show summary of choices if not using --yes flag
    if (!args.yes && (args.template || args.version || args.mode || args.git || args.types === false)) {
      p.log.message('');
      p.log.info('Project configuration:');
      p.log.info(`  Project name: ${projectName}`);
      p.log.info(`  Template: ${selectedTemplate}`);
      p.log.info(`  p5.js version: ${selectedVersion}`);
      p.log.info(`  Delivery mode: ${selectedMode}`);
      p.log.info(`  Git initialization: ${args.git ? 'yes' : 'no'}`);
      p.log.info(`  TypeScript definitions: ${args.types === false ? 'no' : 'yes'}`);
      p.log.message('');
    }

    // Copy or fetch template files (local built-in templates or remote templates)
    const copySpinner = p.spinner();
    if (isRemoteTemplateSpec(selectedTemplate)) {
      copySpinner.start('Fetching remote template');
      if (args.verbose) {
        const spec = normalizeTemplateSpec(selectedTemplate);
        p.log.info(`  Remote template spec: ${spec}`);
        p.log.info(`  Target path: ${targetPath}`);
      }

      try {
        await fetchTemplate(selectedTemplate, targetPath, { verbose: args.verbose });
        copySpinner.stop(green('✓') + ' Fetched remote template');
      } catch (err) {
        copySpinner.stop(red('✗') + ' Failed to fetch remote template');
        throw new Error(`Failed to fetch remote template "${selectedTemplate}": ${err.message}`);
      }
    } else {
      // Set up paths based on selected template
      const templatePath = path.join(__dirname, 'templates', selectedTemplate);

      // Copy template files
      copySpinner.start('Copying template files');
      if (args.verbose) {
        p.log.info(`  Template path: ${templatePath}`);
        p.log.info(`  Target path: ${targetPath}`);
      }
      await copyTemplateFiles(templatePath, targetPath);
      copySpinner.stop(green('✓') + ' Copied template files');
    }

    // Initialize git repository if requested (do this before other file operations)
    if (args.git) {
      const gitSpinner = p.spinner();
      gitSpinner.start('Initializing git repository');
      await initGit(targetPath);
      gitSpinner.stop(green('✓') + ' Initialized git repository');
    }

    // If local mode, create lib directory and download p5.js files
    if (selectedMode === 'local') {
      const libPath = path.join(targetPath, 'lib');
      await fs.mkdir(libPath, { recursive: true });
      const downloadSpinner = p.spinner();
      downloadSpinner.start('Downloading p5.js files');
      try {
        await downloadP5Files(selectedVersion, libPath);
        await addLibToGitignore(targetPath);
        downloadSpinner.stop(green('✓') + ' Downloaded p5.js files');
      } catch (error) {
        downloadSpinner.stop(red('✗') + ' Failed to download p5.js files');
        p.log.error(error.message);
        p.log.message('');
        p.log.info('Cleaning up...');
        await fs.rm(targetPath, { recursive: true, force: true });
        process.exit(1);
      }
    }

    // Inject p5.js script tag into index.html
    const indexPath = path.join(targetPath, 'index.html');
    const htmlContent = await fs.readFile(indexPath, 'utf-8');
    const updatedHtml = injectP5Script(htmlContent, selectedVersion, selectedMode);
    await fs.writeFile(indexPath, updatedHtml, 'utf-8');

    // Download TypeScript definitions for IntelliSense (all templates)
    let typeDefsVersion = null;
    if (args.types !== false) {
      const typesPath = path.join(targetPath, 'types');
      await fs.mkdir(typesPath, { recursive: true });
      const typesSpinner = p.spinner();
      typesSpinner.start('Downloading TypeScript definitions');
      try {
        typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath);
        typesSpinner.stop(green('✓') + ' Downloaded TypeScript definitions');
      } catch (error) {
        typesSpinner.stop(blue('⚠') + ' TypeScript definitions unavailable');
        p.log.warn(error.message);
        p.log.info('Continuing without TypeScript definitions...');
        // Don't fail the entire operation if type definitions fail
        typeDefsVersion = null;
      }
    } else {
      p.log.warn('Skipping TypeScript definitions download (--no-types flag)');
    }

    // Create p5-config.json in project root
    const configPath = path.join(targetPath, 'p5-config.json');
    await createConfig(configPath, {
      version: selectedVersion,
      mode: selectedMode,
      template: selectedTemplate,
      typeDefsVersion
    });

    // Success summary
    p.outro(green('✓') + ' Project created successfully!');

    p.log.message('');
    p.log.info(cyan('Project Summary:'));
    p.log.info(`  ${blue('Name:')}        ${projectName}`);
    p.log.info(`  ${blue('Template:')}    ${selectedTemplate}`);
    p.log.info(`  ${blue('p5.js:')}       ${selectedVersion}`);
    p.log.info(`  ${blue('Mode:')}        ${selectedMode}`);
    if (typeDefsVersion) {
      p.log.info(`  ${blue('Types:')}       ${typeDefsVersion}`);
    }
    if (args.git) {
      p.log.info(`  ${blue('Git:')}         initialized`);
    }

    p.log.message('');
    p.log.info(cyan('Next steps:'));
    p.log.info(`  ${green('1.')} cd ${projectName}`);
    p.log.info(`  ${green('2.')} Open ${blue('index.html')} in your browser`);

    // Add template-specific tips
    if (selectedTemplate === 'typescript') {
      p.log.message('');
      p.log.info(cyan('TypeScript tips:'));
      p.log.info(`  • Use a TypeScript-aware editor like VS Code`);
      p.log.info(`  • Install TypeScript: ${blue('npm install -g typescript')}`);
      p.log.info(`  • Compile: ${blue('tsc sketch.ts')}`);
    }

    if (selectedTemplate === 'instance') {
      p.log.message('');
      p.log.info(cyan('Instance mode tips:'));
      p.log.info(`  • Multiple sketches can run on the same page`);
      p.log.info(`  • Use ${blue('new p5(sketch, container)')} to create instances`);
    }

    if (args.git) {
      p.log.message('');
      p.log.info(cyan('Git tips:'));
      p.log.info(`  • Make your first commit: ${blue('git add . && git commit -m "Initial commit"')}`);
      if (selectedMode === 'local') {
        p.log.info(`  • ${blue('lib/')} directory is already in .gitignore`);
      }
    }

    p.log.message('');
    p.log.info(cyan('Documentation:'));
    p.log.info(`  • p5.js reference: ${blue('https://p5js.org/reference/')}`);
    p.log.info(`  • Examples: ${blue('https://p5js.org/examples/')}`);
    p.log.info(`  • Update project: ${blue('npx create-p5 update')}`);

    p.log.message(''); // Empty line for spacing
  } catch (error) {
    p.outro(red('✗') + ' Project creation failed');
    p.log.message('');
    p.log.error(error.message);

    if (args.verbose) {
      p.log.message('');
      p.log.info('Stack trace:');
      p.log.info(error.stack);
    }

    // Attempt to clean up the project directory if it was partially created
    try {
      if (await directoryExists(targetPath)) {
        const cleanupSpinner = p.spinner();
        cleanupSpinner.start('Cleaning up incomplete project directory');
        await fs.rm(targetPath, { recursive: true, force: true });
        cleanupSpinner.stop(green('✓') + ' Cleaned up incomplete project');
      }
    } catch (cleanupError) {
      p.log.warn(`Could not clean up project directory: ${cleanupError.message}`);
    }

    p.log.message('');
    p.log.info('If the problem persists:');
    p.log.info(`  • Try with ${blue('--verbose')} flag for detailed output`);
    p.log.info(`  • Check write permissions in the current directory`);
    p.log.info(`  • Report issues at ${blue('https://github.com/sableraf/create-p5/issues')}`);

    process.exit(1);
  }
}

main();
