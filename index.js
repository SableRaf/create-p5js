#!/usr/bin/env node

/**
 * create-p5 - Scaffolding tool for p5.js projects
 * Entry point for the CLI
 */

import path from 'path';
import minimist from 'minimist';
import { scaffold } from './src/operations/scaffold.js';
import { update } from './src/operations/update.js';
import { configExists, migrateConfigIfNeeded } from './src/config.js';
import { t } from './src/i18n/index.js';
import * as display from './src/ui/display.js';
import { VERSION } from './src/version.js';

async function main() {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    boolean: ['yes', 'git', 'no-types', 'help', 'verbose', 'include-prerelease', 'silent'],
    string: ['template', 'version', 'mode', 'type'],
    alias: {
      y: 'yes',
      g: 'git',
      t: 'template',
      v: 'version',
      m: 'mode',
      h: 'help',
      p: 'include-prerelease',
      s: 'silent'
    }
  });

  if (args.silent) {
    args.yes = true;
    display.setSilentMode(true);
  }

  // Handle --version flag (when used without a value)
  if (args.version === true || (args.version === '' && !args._.length)) {
    console.log(VERSION);
    process.exit(0);
  }

  // Handle --help flag
  if (args.help) {
    display.message(t('cli.help.usage'));
    process.exit(0);
  }

  // Handle 'update' command explicitly
  if (args._[0] === 'update') {
    await update();
    return;
  }

  // Check for old config file and migrate if found (before checking for existing project)
  const migrationResult = await migrateConfigIfNeeded(process.cwd());
  if (migrationResult.migrated) {
    display.warn('info.update.migratedConfig');
  } else if (migrationResult.error) {
    display.warn(migrationResult.error);
  }

  // Check if we're in an existing p5.js project
  const currentConfigPath = path.join(process.cwd(), '.p5-config.json');

  if (await configExists(currentConfigPath)) {
    display.info('error.existingProject.detected');
    display.info('error.existingProject.alreadyProject');
    display.message('');
    display.info('error.existingProject.updateHint');
    display.info('error.existingProject.updateCommand');
    process.exit(0);
  }

  // Route to scaffolding
  await scaffold(args);
}

main();
