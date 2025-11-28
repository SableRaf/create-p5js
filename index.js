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
import degit from 'degit';


function isRemoteTemplateSpec(t) {
  if (!t || typeof t !== 'string') return false;
  // Full URL
  if (/^https?:\/\//.test(t)) return true;
  // GitHub shorthand: user/repo or user/repo/subdir or user/repo#branch
  if (/^[^\s]+\/[^^\s]+/.test(t)) return true;
  return false;
}


function normalizeTemplateSpec(t) {
  // If it's already a degit-style spec (contains # or / after user/repo), return as-is
  if (!t || typeof t !== 'string') return t;

  // If it's a full URL, try to convert common GitHub URLs to degit spec
  if (/^https?:\/\//.test(t)) {
    try {
      const u = new URL(t);
      // Only handle github.com URLs specially; otherwise return full URL (degit accepts github shorthand)
      if (u.hostname.includes('github.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const user = parts[0];
          let repo = parts[1];
          repo = repo.replace(/\.git$/, '');

          // Handle URLs like /user/repo/tree/branch/path
          if (parts[2] === 'tree' && parts[3]) {
            const branch = parts[3];
            const subpath = parts.slice(4).join('/');
            let spec = `${user}/${repo}`;
            if (subpath) spec += `/${subpath}`;
            spec += `#${branch}`;
            return spec;
          }

          // Handle direct repo URLs
          return `${user}/${repo}`;
        }
      }
    } catch (e) {
      // fall through
    }
  }

  return t;
}

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
    console.error(`Error: ${nameError}`);
    process.exit(1);
  }

  // Check if we're in an existing p5.js project (but not if running 'update' command)
  const currentConfigPath = path.join(process.cwd(), 'p5-config.json');
  if (await configExists(currentConfigPath)) {
    console.log('Existing p5.js project detected (p5-config.json found).');
    console.log('This directory is already a create-p5 project.');
    console.log('\nTo update this project, use:');
    console.log('  npx create-p5 update');
    process.exit(0);
  }

  // Check if target directory already exists
  const targetPath = path.join(process.cwd(), projectName);
  if (await directoryExists(targetPath)) {
    console.error(`Error: Directory "${projectName}" already exists.`);
    console.error(`Suggestion: Choose a different project name or remove the existing directory.`);
    process.exit(1);
  }

  p.intro(cyan('create-p5'));
  console.log(`Creating project: ${blue(projectName)}`);

  if (args.verbose) {
    console.log(`${blue('Verbose mode enabled')}`);
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
      console.error(`\n${red('Error:')} ${error.message}`);
      console.error('\nTroubleshooting:');
      console.error('  1. Check your internet connection');
      console.error('  2. Verify that https://data.jsdelivr.com is accessible');
      console.error('  3. Try again in a few moments');
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
      console.log(`${green('✓')} Using template: ${blue(selectedTemplate)}`);
    } else if (args.yes) {
      selectedTemplate = 'basic';
      console.log(`${green('✓')} Using default template: ${blue('basic')}`);
    } else {
      selectedTemplate = await selectTemplate();
    }

    // Determine version (flag or prompt)
    let selectedVersion;
    if (args.version) {
      selectedVersion = args.version === 'latest' ? latest : args.version;
      console.log(`${green('✓')} Using p5.js version: ${blue(selectedVersion)}`);
    } else if (args.yes) {
      selectedVersion = latest;
      console.log(`${green('✓')} Using latest p5.js version: ${blue(latest)}`);
    } else {
      selectedVersion = await selectVersion(versions, latest);
    }

    // Determine delivery mode (flag or prompt)
    let selectedMode;
    if (args.mode) {
      selectedMode = args.mode;
      console.log(`${green('✓')} Using delivery mode: ${blue(selectedMode)}`);
    } else if (args.yes) {
      selectedMode = 'cdn';
      console.log(`${green('✓')} Using default delivery mode: ${blue('cdn')}`);
    } else {
      selectedMode = await selectMode();
    }

    // Show summary of choices if not using --yes flag
    if (!args.yes && (args.template || args.version || args.mode || args.git || args.types === false)) {
      console.log('\nProject configuration:');
      console.log(`  Project name: ${projectName}`);
      console.log(`  Template: ${selectedTemplate}`);
      console.log(`  p5.js version: ${selectedVersion}`);
      console.log(`  Delivery mode: ${selectedMode}`);
      console.log(`  Git initialization: ${args.git ? 'yes' : 'no'}`);
      console.log(`  TypeScript definitions: ${args.types === false ? 'no' : 'yes'}`);
      console.log('');
    }

    // Copy or fetch template files (local built-in templates or remote templates)
    const copySpinner = p.spinner();
    if (isRemoteTemplateSpec(selectedTemplate)) {
      copySpinner.start('Fetching remote template');
      const spec = normalizeTemplateSpec(selectedTemplate);
      if (args.verbose) {
        console.log(`  Remote template spec: ${spec}`);
        console.log(`  Target path: ${targetPath}`);
      }

      try {
        const emitter = degit(spec, { cache: false, force: true, verbose: !!args.verbose });
        await emitter.clone(targetPath);
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
        console.log(`  Template path: ${templatePath}`);
        console.log(`  Target path: ${targetPath}`);
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
        console.error(`${red('Error:')} ${error.message}`);
        console.error('\nCleaning up...');
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
        console.error(`${blue('Warning:')} ${error.message}`);
        console.error('Continuing without TypeScript definitions...');
        // Don't fail the entire operation if type definitions fail
        typeDefsVersion = null;
      }
    } else {
      console.log(`${blue('⚠')} Skipping TypeScript definitions download (--no-types flag)`);
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

    console.log('\n' + cyan('Project Summary:'));
    console.log(`  ${blue('Name:')}        ${projectName}`);
    console.log(`  ${blue('Template:')}    ${selectedTemplate}`);
    console.log(`  ${blue('p5.js:')}       ${selectedVersion}`);
    console.log(`  ${blue('Mode:')}        ${selectedMode}`);
    if (typeDefsVersion) {
      console.log(`  ${blue('Types:')}       ${typeDefsVersion}`);
    }
    if (args.git) {
      console.log(`  ${blue('Git:')}         initialized`);
    }

    console.log('\n' + cyan('Next steps:'));
    console.log(`  ${green('1.')} cd ${projectName}`);
    console.log(`  ${green('2.')} Open ${blue('index.html')} in your browser`);

    // Add template-specific tips
    if (selectedTemplate === 'typescript') {
      console.log('\n' + cyan('TypeScript tips:'));
      console.log(`  • Use a TypeScript-aware editor like VS Code`);
      console.log(`  • Install TypeScript: ${blue('npm install -g typescript')}`);
      console.log(`  • Compile: ${blue('tsc sketch.ts')}`);
    }

    if (selectedTemplate === 'instance') {
      console.log('\n' + cyan('Instance mode tips:'));
      console.log(`  • Multiple sketches can run on the same page`);
      console.log(`  • Use ${blue('new p5(sketch, container)')} to create instances`);
    }

    if (args.git) {
      console.log('\n' + cyan('Git tips:'));
      console.log(`  • Make your first commit: ${blue('git add . && git commit -m "Initial commit"')}`);
      if (selectedMode === 'local') {
        console.log(`  • ${blue('lib/')} directory is already in .gitignore`);
      }
    }

    console.log('\n' + cyan('Documentation:'));
    console.log(`  • p5.js reference: ${blue('https://p5js.org/reference/')}`);
    console.log(`  • Examples: ${blue('https://p5js.org/examples/')}`);
    console.log(`  • Update project: ${blue('npx create-p5 update')}`);

    console.log(''); // Empty line for spacing
  } catch (error) {
    p.outro(red('✗') + ' Project creation failed');
    console.error(`\n${red('Error:')} ${error.message}`);

    if (args.verbose) {
      console.error('\nStack trace:');
      console.error(error.stack);
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
      console.error(`${red('Warning:')} Could not clean up project directory: ${cleanupError.message}`);
    }

    console.error('\nIf the problem persists:');
    console.error(`  • Try with ${blue('--verbose')} flag for detailed output`);
    console.error(`  • Check write permissions in the current directory`);
    console.error(`  • Report issues at ${blue('https://github.com/sableraf/create-p5/issues')}`);

    process.exit(1);
  }
}

main();
