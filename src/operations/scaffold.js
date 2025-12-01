/**
 * Scaffolding operations - Creates new p5.js projects
 * Philosophy: Business logic only, NO inline copy
 * All UI text comes from i18n layer
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// i18n
import { t } from '../i18n/index.js';

// UI primitives
import * as display from '../ui/display.js';
import * as prompts from '../ui/prompts.js';

// Business utilities
import { copyTemplateFiles, validateProjectName, directoryExists, validateTemplate, validateMode, validateVersion, generateProjectName } from '../utils.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from '../version.js';
import { injectP5Script } from '../htmlManager.js';
import { createConfig } from '../config.js';
import { initGit, addLibToGitignore } from '../git.js';
import { isRemoteTemplateSpec, normalizeTemplateSpec, fetchTemplate } from '../templateFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main scaffolding function
 * @param {Object} args - Parsed command line arguments
 * @returns {Promise<void>}
 */
export async function scaffold(args) {
  display.intro();

  // Determine project path (command argument, flag, or prompt)
  let projectPath;
  const firstArg = args._[0];

  if (firstArg && firstArg !== 'update') {
    // User provided a path as first argument
    projectPath = firstArg;
  } else if (args.yes) {
    // --yes flag: use random project name
    projectPath = generateProjectName();
  } else {
    // Interactive mode: prompt for path
    const randomName = generateProjectName();
    projectPath = await prompts.promptProjectPath(`./${randomName}`);
    if (prompts.isCancel(projectPath)) {
      display.cancel('prompt.cancel.sketchCreation');
    }
  }

  // Normalize the path
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

  // Determine target path
  const targetPath = projectPath === '.' ? process.cwd() : path.join(process.cwd(), projectPath);

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

  if (args.verbose) {
    display.info('info.verboseEnabled');
  }

  try {
    // Fetch available p5.js versions
    let latest, versions;
    if (args.verbose) {
      const s = display.spinner('spinner.fetchingVersions');
      try {
        ({ latest, versions } = await fetchVersions(args['include-prerelease']));
        s.stop('spinner.fetchedVersions');
        if (args['include-prerelease']) {
          display.info('info.includePrerelease');
        }
      } catch (error) {
        s.stop('spinner.failedVersions');
        display.message('');
        display.error('error.fetchVersions.failed');
        display.message(error.message);
        display.message('');
        display.info('error.fetchVersions.troubleshooting');
        display.info('error.fetchVersions.step1');
        display.info('error.fetchVersions.step2');
        display.info('error.fetchVersions.step3');
        process.exit(1);
      }
    } else {
      try {
        ({ latest, versions } = await fetchVersions(args['include-prerelease']));
        if (args['include-prerelease']) {
          display.info('info.includePrerelease');
        }
      } catch (error) {
        display.message('');
        display.error('error.fetchVersions.failed');
        display.message(error.message);
        display.message('');
        display.info('error.fetchVersions.troubleshooting');
        display.info('error.fetchVersions.step1');
        display.info('error.fetchVersions.step2');
        display.info('error.fetchVersions.step3');
        process.exit(1);
      }
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
      display.success('info.usingTemplate', { template: selectedTemplate });
    } else if (args.yes) {
      selectedTemplate = 'basic';
      display.success('info.defaultTemplate');
    } else {
      selectedTemplate = await prompts.promptTemplate();
      if (prompts.isCancel(selectedTemplate)) {
        display.cancel('prompt.cancel.sketchCreation');
      }
    }

    // Determine version (flag or prompt)
    let selectedVersion;
    if (args.version) {
      selectedVersion = args.version === 'latest' ? latest : args.version;
      display.success('info.usingVersion', { version: selectedVersion });
    } else if (args.yes) {
      selectedVersion = latest;
      display.success('info.latestVersion', { version: latest });
    } else {
      selectedVersion = await prompts.promptVersion(versions, latest);
      if (prompts.isCancel(selectedVersion)) {
        display.cancel('prompt.cancel.sketchCreation');
      }
    }

    // Determine delivery mode (flag or prompt)
    let selectedMode;
    if (args.mode) {
      selectedMode = args.mode;
      display.success('info.usingMode', { mode: selectedMode });
    } else if (args.yes) {
      selectedMode = 'cdn';
      display.success('info.defaultMode');
    } else {
      selectedMode = await prompts.promptMode();
      if (prompts.isCancel(selectedMode)) {
        display.cancel('prompt.cancel.sketchCreation');
      }
    }

    // Show summary of choices if not using --yes flag
    if (!args.yes && (args.template || args.version || args.mode || args.git || args.types === false)) {
      display.message('');
      const configLines = [
        'info.config.header',
        'info.config.projectName',
        'info.config.template',
        'info.config.version',
        'info.config.mode',
        args.git ? 'info.config.git.yes' : 'info.config.git.no',
        args.types === false ? 'info.config.types.no' : 'info.config.types.yes'
      ];
      configLines.forEach(key => display.info(key, {
        name: projectName,
        template: selectedTemplate,
        version: selectedVersion,
        mode: selectedMode
      }));
      display.message('');
    }

    // Copy or fetch template files (local built-in templates or remote templates)
    if (isRemoteTemplateSpec(selectedTemplate)) {
      if (args.verbose) {
        const copySpinner = display.spinner('spinner.fetchingRemoteTemplate');
        const spec = normalizeTemplateSpec(selectedTemplate);
        display.info('note.verbose.remoteTemplateSpec', { spec });
        display.info('note.verbose.targetPath', { path: targetPath });

        try {
          await fetchTemplate(selectedTemplate, targetPath, { verbose: args.verbose });
          copySpinner.stop('spinner.fetchedRemoteTemplate');
        } catch (err) {
          copySpinner.stop('spinner.failedRemoteTemplate');
          throw new Error(t('error.fetchTemplate', { template: selectedTemplate, error: err.message }));
        }
      } else {
        try {
          await fetchTemplate(selectedTemplate, targetPath, { verbose: args.verbose });
        } catch (err) {
          throw new Error(t('error.fetchTemplate', { template: selectedTemplate, error: err.message }));
        }
      }
    } else {
      // Set up paths based on selected template
      const templatePath = path.join(__dirname, '..', '..', 'templates', selectedTemplate);

      // Copy template files
      if (args.verbose) {
        const copySpinner = display.spinner('spinner.copyingTemplate');
        display.info('note.verbose.templatePath', { path: templatePath });
        display.info('note.verbose.targetPath', { path: targetPath });
        await copyTemplateFiles(templatePath, targetPath);
        copySpinner.stop('spinner.copiedTemplate');
      } else {
        await copyTemplateFiles(templatePath, targetPath);
      }
    }

    // Initialize git repository if requested (do this before other file operations)
    if (args.git) {
      if (args.verbose) {
        const gitSpinner = display.spinner('spinner.initializingGit');
        await initGit(targetPath);
        gitSpinner.stop('spinner.initializedGit');
      } else {
        await initGit(targetPath);
      }
    }

    // If local mode, create lib directory and download p5.js files
    if (selectedMode === 'local') {
      const libPath = path.join(targetPath, 'lib');
      await fs.mkdir(libPath, { recursive: true });
      try {
        if (args.verbose) {
          const downloadSpinner = display.spinner('spinner.downloadingP5File', { filename: 'p5.js' });
          await downloadP5Files(selectedVersion, libPath, downloadSpinner);
          downloadSpinner.stop('spinner.downloadedP5');
        } else {
          await downloadP5Files(selectedVersion, libPath);
        }
        await addLibToGitignore(targetPath);
      } catch (error) {
        display.error('error.fetchVersions.failed');
        display.message(error.message);
        display.message('');
        display.info('error.cleanup');
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
      try {
        if (args.verbose) {
          const typesSpinner = display.spinner('spinner.downloadingTypes');
          typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath, typesSpinner, selectedTemplate);
        } else {
          typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath, null, selectedTemplate);
        }
      } catch (error) {
        display.warn('error.fetchVersions.failed');
        display.message(error.message);
        display.info('info.continueWithoutTypes');
        // Don't fail the entire operation if type definitions fail
        typeDefsVersion = null;
      }
    } else {
      display.warn('info.skipTypes');
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
    display.outro(t('note.success.created'));

    // Build project summary
    const summaryLines = [
      'note.projectSummary.name',
      'note.projectSummary.template',
      'note.projectSummary.version',
      'note.projectSummary.mode'
    ];
    if (typeDefsVersion) {
      summaryLines.push('note.projectSummary.types');
    }
    if (args.git) {
      summaryLines.push('note.projectSummary.git');
    }
    display.note(summaryLines, 'note.projectSummary.title', {
      name: projectName,
      template: selectedTemplate,
      version: selectedVersion,
      mode: selectedMode,
      types: typeDefsVersion
    });

    // Next steps and documentation
    const nextStepsLines = [
      'note.nextSteps.step1',
      'note.nextSteps.step2',
      'note.nextSteps.documentation',
      'note.nextSteps.reference',
      'note.nextSteps.examples',
      'note.nextSteps.update'
    ];
    display.note(nextStepsLines, 'note.nextSteps.title', { projectName });

    // Template-specific tips
    if (selectedTemplate === 'typescript') {
      const tipsLines = [
        'note.typescriptTips.editor',
        'note.typescriptTips.install',
        'note.typescriptTips.compile'
      ];
      display.note(tipsLines, 'note.typescriptTips.title');
    }

    if (selectedTemplate === 'instance') {
      const tipsLines = [
        'note.instanceTips.multiple',
        'note.instanceTips.usage'
      ];
      display.note(tipsLines, 'note.instanceTips.title');
    }

    if (args.git) {
      const gitTipsLines = ['note.gitTips.firstCommit'];
      if (selectedMode === 'local') {
        gitTipsLines.push('note.gitTips.libIgnored');
      }
      display.note(gitTipsLines, 'note.gitTips.title');
    }
  } catch (error) {
    display.outro(t('note.success.failed'));
    display.message('');
    display.error('error.fetchVersions.failed');
    display.message(error.message);

    if (args.verbose) {
      display.message('');
      display.info('info.stackTrace');
      display.message(error.stack);
    }

    // Attempt to clean up the project directory if it was partially created
    try {
      if (await directoryExists(targetPath)) {
        const cleanupSpinner = display.spinner('spinner.cleaningUp');
        await fs.rm(targetPath, { recursive: true, force: true });
        cleanupSpinner.stop('spinner.cleanedUp');
      }
    } catch (cleanupError) {
      display.warn('error.cleanup');
      display.message(cleanupError.message);
    }

    const helpLines = [
      'error.persistHelp.verbose',
      'error.persistHelp.permissions',
      'error.persistHelp.issues'
    ];
    display.note(helpLines, 'error.persistHelp.title');

    process.exit(1);
  }
}
