/**
 * CLI module - Routes between scaffold and update workflows
 */

import path from 'path';
import minimist from 'minimist';
import { configExists } from './config.js';
import { update } from './update.js';

/**
 * Main CLI entry point
 * Detects whether to scaffold a new project or update an existing one
 * @returns {Promise<void>}
 */
export async function cli() {
  const args = minimist(process.argv.slice(2));
  const command = args._[0];

  // Check if we're in an existing p5.js project
  const currentConfigPath = path.join(process.cwd(), 'p5-config.json');
  const isExistingProject = await configExists(currentConfigPath);

  // Handle 'update' command explicitly
  if (command === 'update') {
    await update();
    return;
  }

  // If in existing project directory and no command specified, suggest update
  if (isExistingProject && !command) {
    console.log('Existing p5.js project detected (p5-config.json found).');
    console.log('This directory is already a create-p5 project.');
    console.log('\nTo update this project, use:');
    console.log('  npx create-p5 update');
    process.exit(0);
  }

  // Otherwise, route to scaffold workflow
  // For now, just show that scaffold would be called
  console.log('Scaffold workflow would be called here (not yet integrated).');
}
