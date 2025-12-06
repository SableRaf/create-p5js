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
import { copyTemplateFiles, validateProjectName, directoryExists, validateMode, validateVersion, validateLanguage, validateP5Mode, getTemplateName, generateProjectName, isRemoteTemplateSpec as isRemoteTemplateSpecUtil } from '../utils.js';
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

  // Determine if user wants to customize (only in interactive mode without flags)
  let shouldCustomize = false;
  const hasConfigFlags = args.language || args['p5-mode'] || args.version || args.mode || args.template;

  if (!args.yes && !hasConfigFlags) {
    // Interactive mode without config flags: ask if they want to customize
    shouldCustomize = await prompts.promptCustomize();
    if (prompts.isCancel(shouldCustomize)) {
      display.cancel('prompt.cancel.sketchCreation');
    }
  } else if (hasConfigFlags) {
    // If user provided config flags, they clearly want to customize
    shouldCustomize = true;
  }
  // If --yes flag, shouldCustomize remains false (use defaults)

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
    if (args.language) {
      const langError = validateLanguage(args.language);
      if (langError) {
        throw new Error(langError);
      }
    }

    if (args['p5-mode']) {
      const p5ModeError = validateP5Mode(args['p5-mode']);
      if (p5ModeError) {
        throw new Error(p5ModeError);
      }
    }

    if (args.template) {
      // --template flag now ONLY for community templates
      if (!isRemoteTemplateSpecUtil(args.template)) {
        throw new Error(t('error.templateMustBeRemote', { template: args.template }));
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

    // Determine version (flag, default, or prompt)
    let selectedVersion;
    if (args.version) {
      selectedVersion = args.version === 'latest' ? latest : args.version;
      display.success('info.usingVersion', { version: selectedVersion });
    } else if (!shouldCustomize) {
      // Use default (latest) when not customizing
      selectedVersion = latest;
      display.success('info.latestVersion', { version: latest });
    } else {
      // Interactive customization mode
      selectedVersion = await prompts.promptVersion(versions, latest);
      if (prompts.isCancel(selectedVersion)) {
        display.cancel('prompt.cancel.sketchCreation');
      }
    }

    // Determine delivery mode (flag, default, or prompt)
    let selectedMode;
    if (args.mode) {
      selectedMode = args.mode;
      display.success('info.usingMode', { mode: selectedMode });
    } else if (!shouldCustomize) {
      // Use default (cdn) when not customizing
      selectedMode = 'cdn';
      display.success('info.defaultMode');
    } else {
      // Interactive customization mode
      selectedMode = await prompts.promptMode();
      if (prompts.isCancel(selectedMode)) {
        display.cancel('prompt.cancel.sketchCreation');
      }
    }

    // Determine language, p5Mode, and template
    let selectedLanguage, selectedP5Mode, selectedTemplate;

    if (args.template) {
      // Community template - skip language/mode prompts
      selectedTemplate = args.template;
      selectedLanguage = null;
      selectedP5Mode = null;
      display.success('info.usingCommunityTemplate', { template: selectedTemplate });
    } else if (args.language && args['p5-mode']) {
      // Non-interactive with flags
      selectedLanguage = args.language;
      selectedP5Mode = args['p5-mode'];
      selectedTemplate = null;
      display.success('info.usingLanguageMode', { language: selectedLanguage, p5Mode: selectedP5Mode });
    } else if (!shouldCustomize) {
      // Use defaults: JavaScript + Global mode (when not customizing)
      selectedLanguage = 'javascript';
      selectedP5Mode = 'global';
      selectedTemplate = null;
      display.success('info.defaultLanguageMode');
    } else {
      // Interactive customization mode: prompt for language and mode
      const choices = await prompts.promptLanguageAndMode();
      if (prompts.isCancel(choices)) {
        display.cancel('prompt.cancel.sketchCreation');
      }
      [selectedLanguage, selectedP5Mode] = choices;
      selectedTemplate = null;
    }


    // Show summary of choices if not using --yes flag
    if (!args.yes && (args.template || args.language || args['p5-mode'] || args.version || args.mode || args.git || args.types === false)) {
      display.message('');
      const configLines = [
        'info.config.header',
        'info.config.projectName'
      ];
      if (selectedLanguage) {
        configLines.push('info.config.language', 'info.config.p5Mode');
      }
      configLines.push(
        'info.config.version',
        'info.config.mode',
        args.git ? 'info.config.git.yes' : 'info.config.git.no',
        args.types === false ? 'info.config.types.no' : 'info.config.types.yes'
      );
      configLines.forEach(key => display.info(key, {
        name: projectName,
        language: selectedLanguage,
        p5Mode: selectedP5Mode,
        version: selectedVersion,
        mode: selectedMode
      }));
      display.message('');
    }

    // Copy or fetch template files (local built-in templates or remote templates)
    if (selectedTemplate) {
      // Community template - fetch from remote
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
      // Built-in template - use language and mode to determine template directory
      const templateDir = getTemplateName(selectedLanguage, selectedP5Mode);
      const templatePath = path.join(__dirname, '..', '..', 'templates', templateDir);

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

    // Download TypeScript definitions
    let typeDefsVersion = null;
    if (args.types !== false) {
      const typesPath = path.join(targetPath, 'types');
      await fs.mkdir(typesPath, { recursive: true });
      try {
        // Determine template mode for type definitions (global vs instance)
        const templateMode = selectedP5Mode || 'global'; // Default to global if using community template
        if (args.verbose) {
          const typesSpinner = display.spinner('spinner.downloadingTypes');
          typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath, typesSpinner, templateMode);
        } else {
          typeDefsVersion = await downloadTypeDefinitions(selectedVersion, typesPath, null, templateMode);
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
      language: selectedLanguage,
      p5Mode: selectedP5Mode,
      typeDefsVersion
    });

    // Success summary
    display.outro(t('note.success.created'));

    // Build project summary
    const summaryLines = [
      'note.projectSummary.name'
    ];
    if (selectedLanguage) {
      summaryLines.push('note.projectSummary.language', 'note.projectSummary.p5Mode');
    }
    summaryLines.push(
      'note.projectSummary.version',
      'note.projectSummary.mode'
    );
    if (typeDefsVersion) {
      summaryLines.push('note.projectSummary.types');
    }
    if (args.git) {
      summaryLines.push('note.projectSummary.git');
    }
    display.note(summaryLines, 'note.projectSummary.title', {
      name: projectName,
      language: selectedLanguage,
      p5Mode: selectedP5Mode,
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

    // Language and mode-specific tips
    if (selectedLanguage === 'typescript') {
      const tipsLines = [
        'note.typescriptTips.editor',
        'note.typescriptTips.install',
        'note.typescriptTips.compile'
      ];
      display.note(tipsLines, 'note.typescriptTips.title');
    }

    if (selectedP5Mode === 'instance') {
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
