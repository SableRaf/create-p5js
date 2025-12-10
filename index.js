#!/usr/bin/env node

/**
 * create-p5 - Scaffolding tool for p5.js projects
 * Entry point for the CLI
 */

import path from 'path';
import fs from 'fs/promises';
import minimist from 'minimist';
import { scaffold } from './src/operations/scaffold.js';
import { update } from './src/operations/update.js';
import { configExists } from './src/config.js';
import { t } from './src/i18n/index.js';
import * as display from './src/ui/display.js';
import { fileExists } from './src/utils.js';

async function main() {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    boolean: ['yes', 'git', 'no-types', 'help', 'verbose', 'include-prerelease'],
    string: ['template', 'version', 'mode'],
    alias: {
      y: 'yes',
      g: 'git',
      t: 'template',
      v: 'version',
      m: 'mode',
      h: 'help',
      p: 'include-prerelease'
    }
  });

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

  // Check if we're in an existing p5.js project (but not if running 'update' command)
  const currentConfigPath = path.join(process.cwd(), '.p5-config.json');
  const oldConfigPath = path.join(process.cwd(), 'p5-config.json');

  // Check for old config file and migrate if found
  if (await fileExists(oldConfigPath)) {
    await fs.rename(oldConfigPath, currentConfigPath);
    display.warn('info.update.migratedConfig');
  }

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
