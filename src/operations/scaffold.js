/**
 * Scaffolding operations - Creates new p5.js projects
 * Philosophy: Business logic only, NO inline copy
 * All UI text comes from i18n layer
 */

import path from 'path';

// i18n
import { t } from '../i18n/index.js';

// UI primitives
import * as display from '../ui/display.js';

// Business utilities
import { createConfig } from '../config.js';
import { initGit } from '../git.js';
import { isRemoteTemplateSpec } from '../utils.js';

//Scaffold steps
import { handleErrorInScaffold } from './handleErrorInScaffold.js';
import { stepDetermineDeliveryMode } from './steps/stepDetermineDeliveryMode.js';
import { stepDetermineLanguageAndP5Mode } from './steps/stepDetermineLanguageAndP5Mode.js';
import { stepDetermineP5Version } from './steps/stepDetermineP5Version.js';
import { stepDeterminePaths } from './steps/stepDeterminePaths.js';
import { stepDetermineSetupType } from './steps/stepDetermineSetupType.js';
import { stepDownloadP5Libs } from './steps/stepDownloadP5Libs.js';
import { stepDownloadP5TypeDeclarations } from './steps/stepDownloadP5TypeDeclarations.js';
import { stepFetchP5VersionsOrFail } from './steps/stepFetchP5VersionsOrFail.js';
import { stepHandleCustomTemplate } from './steps/stepHandleCustomTemplate.js';
import { stepInjectP5ScriptIntoPage } from './steps/stepInjectP5ScriptIntoPage.js';
import { stepPrintProjectSummary } from './steps/stepPrintProjectSummary.js';
import { stepShowArgSummary } from './steps/stepShowArgSummary.js';
import { stepValidateAllOtherArgs } from './steps/stepValidateAllOtherArgs.js';
import { stepCopyBuiltinTemplateFiles } from './steps/stepCopyBuiltinTemplateFiles.js';
import { stepDetermineProjectPathCandidate } from './steps/stepDetermineProjectPathCandidate.js';

/** @typedef {import('../types.js').CliArgs} CliArgs */
/** @typedef {import('../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../types.js').Language} Language */
/** @typedef {import('../types.js').P5Mode} P5Mode */
/** @typedef {import('../types.js').SetupType} SetupType */

/**
 * Main scaffolding function
 * @param {CliArgs} args - Parsed command line arguments
 * @returns {Promise<void>}
 */
export async function scaffold(args) {
  display.intro();

  // STEP: Determine project path (command argument, flag, or prompt)
  let projectPathCandidate = await stepDetermineProjectPathCandidate(args);

  // STEP: Determine setup type (allow override via --type flag)

  const setupType = await stepDetermineSetupType(args);
  const { targetPath, projectName } = await stepDeterminePaths(projectPathCandidate);

  if (args.verbose) {
    display.info('info.verboseEnabled');
  }


  try {
    // Fetch available p5.js versions (skip for community templates)
  
    //TODO: reinstate
    // if (!args.template) {
  
    let { versions, latest } = await stepFetchP5VersionsOrFail(
      {"include-prerelease": args['include-prerelease'], 
        "verbose": args.verbose
      });
    //}
    
    // Validate template flag first
    if (args.template) {
      // --template flag now ONLY for community templates
      if (!isRemoteTemplateSpec(args.template)) {
        throw new Error(t('error.templateMustBeRemote', { template: args.template }));
      }
    }

    const argsAfterValidation = stepValidateAllOtherArgs(args, versions, latest);
    
    // STEP: Handle community templates  
    // Handle community templates early - they don't need version/mode selection
    if (args.template) {
      // Community template - fetch from remote and exit early
      // We don't modify community templates - just clone them
      await stepHandleCustomTemplate(args.template, targetPath, projectName, {"verbose":args.verbose});
      //this exits
    }

    if (setupType === "handleInTemplate"){
      throw new Error("Should never reach this point");
    }

    // STEP: Built-in templates: determine p5 version (flag, default, or prompt)
    let selectedVersion = await stepDetermineP5Version(args.version, latest, versions, setupType);

    // STEP: For built-in templates, determine delivery mode (flag, default, or prompt)
    /**
     * @type {DeliveryMode}
     */
    if (argsAfterValidation.usingTemplate){
      throw new Error("should never get here");
    }
    
    let selectedDeliveryMode = await stepDetermineDeliveryMode(argsAfterValidation.others.mode, setupType);

    // STEP: Determine language and p5Mode for built-in templates    
    let { selectedLanguage, selectedP5Mode } = await stepDetermineLanguageAndP5Mode(argsAfterValidation.others, setupType);

    // STEP: Show summary of choices if not using --yes flag
    if (!args.yes && (args.language || args['p5-mode'] || args.version || args.mode || args.git || args.types === false)) {
      //TODO: what's the interplay with args.template here?
      stepShowArgSummary(projectName, {selectedLanguage, selectedP5Mode, selectedDeliveryMode, selectedVersion}, args);
    }
    

    // STEP: Copy built-in template files
    await stepCopyBuiltinTemplateFiles(setupType, selectedLanguage, selectedP5Mode, targetPath, {verbose: args.verbose});

    // STEP: Initialize git repository if requested (do this before other file operations)
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
    if (selectedDeliveryMode === 'local') {
      await stepDownloadP5Libs(targetPath, selectedVersion, {verbose:args.verbose});
    }

    // STEP: Inject p5.js script tag into index.html
    await stepInjectP5ScriptIntoPage(targetPath, selectedVersion, selectedDeliveryMode);

    // STEP: Download TypeScript definitions (skip for basic setup, or for flag)
    /**@type {string | null} */
    let typeDefsVersion = null;
    if (setupType === 'basic') {
      // Basic setup never includes type definitions
      display.info('info.skipTypesBasic');
    } else if (args.types !== false) {
      typeDefsVersion = await stepDownloadP5TypeDeclarations(targetPath, selectedP5Mode, args, selectedVersion);
    } else {
      display.warn('info.skipTypes');
    }

    // STEP: Create .p5-config.json in project root
    const configPath = path.join(targetPath, '.p5-config.json');
    await createConfig(configPath, {
      version: selectedVersion,
      mode: selectedDeliveryMode,
      language: selectedLanguage,
      p5Mode: selectedP5Mode,
      typeDefsVersion
    });

    // STEP: Success summary
    display.outro(t('note.success.created'));
    //TODO: display.outro exits - what's with the rest of this code?
    stepPrintProjectSummary(projectName, typeDefsVersion,{selectedP5Mode, selectedVersion, selectedDeliveryMode, selectedLanguage},  args);
  
  } catch (error) {
    await handleErrorInScaffold(args, error, targetPath);
  }
}

