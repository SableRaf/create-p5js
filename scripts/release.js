#!/usr/bin/env node

/**
 * Release script for create-p5
 *
 * This script automates the npm release process with safety checks:
 * 1. Verifies git working directory is clean
 * 2. Runs all tests
 * 3. Prompts for version bump type
 * 4. Updates package.json and creates git tag
 * 5. Asks for final confirmation
 * 6. Publishes to npm
 * 7. Pushes tag to remote
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

const PACKAGE_NAME = JSON.parse(readFileSync('./package.json', 'utf8')).name;

/**
 * Executes a shell command and returns the output
 *
 * @param {string} command - The command to execute
 * @param {boolean} [silent=false] - Whether to suppress output
 * @returns {string} The command output
 */
function exec(command, options = {}) {
  const normalizedOptions =
    typeof options === 'boolean' ? { silent: options } : options;
  const { silent = false, allowFailure = false } = normalizedOptions;

  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    if (allowFailure) {
      throw error;
    }

    console.error(`\n❌ Command failed: ${command}`);
    process.exit(1);
  }
}

/**
 * Prompts the user for input
 *
 * @param {string} question - The question to ask
 * @returns {Promise<string>} The user's response
 */
function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Checks if git working directory is clean
 *
 * @returns {boolean} True if working directory is clean
 */
function isGitClean() {
  const status = exec('git status --porcelain', true);
  return status.trim() === '';
}

/**
 * Gets the current package version
 *
 * @returns {string} The current version
 */
function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  return pkg.version;
}

/**
 * Gets the latest published version from npm
 *
 * @returns {string|null} The latest published version, or null if package not found
 */
function getPublishedVersion() {
  try {
    const result = exec(`npm view ${PACKAGE_NAME} version`, {
      silent: true,
      allowFailure: true
    });
    return result.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a git tag exists locally
 *
 * @param {string} tag - The tag name to check
 * @returns {boolean} True if tag exists
 */
function gitTagExists(tag) {
  try {
    const result = exec(`git tag -l ${tag}`, true);
    return result.trim() !== '';
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a GitHub release exists for a tag
 *
 * @param {string} tag - The tag name to check
 * @returns {boolean} True if GitHub release exists
 */
function githubReleaseExists(tag) {
  try {
    exec(`gh release view ${tag}`, { silent: true, allowFailure: true });
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.status === 127) {
      console.warn('⚠️  GitHub CLI not available. Skipping GitHub release validation.');
      return false;
    }

    // gh returns exit code 1 when the release/tag does not exist.
    if (error?.status === 1) {
      return false;
    }

    console.warn('⚠️  Unable to verify GitHub release. Skipping GitHub release validation.');
    return false;
  }
}

function calculateNextVersion(currentVersion, releaseType) {
  const parts = currentVersion.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid semantic version in package.json');
  }

  let [major, minor, patch] = parts.map((part) => Number.parseInt(part, 10));

  if ([major, minor, patch].some(Number.isNaN)) {
    throw new Error('Invalid semantic version in package.json');
  }

  switch (releaseType) {
    case 'patch':
      patch += 1;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    default:
      throw new Error(`Unknown release type: ${releaseType}`);
  }

  return `${major}.${minor}.${patch}`;
}

function validateReleaseTarget(version, tag) {
  console.log('\n🔍 Validating release state...');

  const publishedVersion = getPublishedVersion();

  if (publishedVersion && publishedVersion === version) {
    console.error(`❌ Version ${version} is already published on npm as the latest release.`);
    process.exit(1);
  }

  if (gitTagExists(tag)) {
    console.error(`❌ Git tag ${tag} already exists. Delete it or pick a different version.`);
    process.exit(1);
  }

  if (githubReleaseExists(tag)) {
    console.error(`❌ GitHub release for ${tag} already exists.`);
    process.exit(1);
  }

  console.log('✅ Release target validated\n');
}

/**
 * Main release workflow
 */
async function release() {
  console.log('🚀 Starting release process...\n');

  // Step 1: Check git status
  console.log('📋 Checking git status...');
  if (!isGitClean()) {
    console.error('❌ Git working directory is not clean. Please commit or stash your changes.');
    process.exit(1);
  }
  console.log('✅ Git working directory is clean\n');

  // Step 2: Run tests
  console.log('🧪 Running tests...');
  exec('npm test');
  console.log('✅ All tests passed\n');

  // Step 3: Prompt for version bump
  const currentVersion = getCurrentVersion();
  console.log(`📦 Current version: ${currentVersion}\n`);
  console.log('Select version bump type:');
  console.log('  1) patch (bug fixes)');
  console.log('  2) minor (new features)');
  console.log('  3) major (breaking changes)');
  console.log('  4) custom version\n');

  const choice = await prompt('Enter your choice (1-4): ');

  let versionType;
  let customVersion;

  switch (choice) {
    case '1':
      versionType = 'patch';
      break;
    case '2':
      versionType = 'minor';
      break;
    case '3':
      versionType = 'major';
      break;
    case '4':
      customVersion = await prompt('Enter custom version (e.g., 1.2.3): ');
      if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(customVersion)) {
        console.error('❌ Invalid version format');
        process.exit(1);
      }
      break;
    default:
      console.error('❌ Invalid choice');
      process.exit(1);
  }

  const targetVersion = customVersion || calculateNextVersion(currentVersion, versionType);
  const targetTag = `v${targetVersion}`;

  validateReleaseTarget(targetVersion, targetTag);

  // Step 4: Update version and create tag
  console.log('\n📝 Updating version...');
  if (customVersion) {
    exec(`npm version ${customVersion} --no-git-tag-version`, true);
    exec('git add package.json');
    exec(`git commit -m "chore: bump version to ${customVersion}"`);
    exec(`git tag ${targetTag}`);
  } else {
    exec(`npm version ${versionType}`);
  }

  const newVersion = getCurrentVersion();
  console.log(`✅ Version updated to ${newVersion}\n`);

  // Step 5: Final confirmation
  console.log('⚠️  You are about to:');
  console.log(`   • Publish version ${newVersion} to npm`);
  console.log(`   • Push tag v${newVersion} to remote`);
  console.log();

  const confirm = await prompt('Continue with publish? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Release cancelled');
    console.log('⚠️  Note: Version has been updated and committed locally.');
    console.log('   You may want to reset this with: git reset --hard HEAD~1');
    process.exit(1);
  }

  // Step 6: Publish to npm
  console.log('\n📤 Publishing to npm...');
  exec('npm publish --access public');
  console.log('✅ Published to npm\n');

  // Step 7: Push to remote
  console.log('📤 Pushing to remote...');
  exec('git push');
  exec(`git push origin v${newVersion}`);
  console.log('✅ Pushed to remote\n');

  console.log(`🎉 Successfully released version ${newVersion}!`);
  console.log(`\n📦 Package: https://www.npmjs.com/package/${PACKAGE_NAME}/v/${newVersion}`);
}

// Run the release
release().catch((error) => {
  console.error('\n❌ Release failed:', error.message);
  process.exit(1);
});
