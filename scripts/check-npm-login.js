
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
/**
 * 
 * @param {string} command 
 * @returns {string} the stdout from the command
 */
function runCommand(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}
/**
 * 
 * @param {string} packageName 
 * @returns {string[]} 
 */
function getMaintainerUsernames(packageName) {
  const output = runCommand(`npm view ${packageName} maintainers --json`);
  if (!output) {
    return [];
  }

  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed
        .map((maintainer) => {
          if (typeof maintainer === 'string') {
            return maintainer.replace(/\s*<.*>$/, '').trim();
          }
          return maintainer?.name;
        })
        .filter((name) => typeof name === 'string' && name.length > 0);
    }
    if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
      return [parsed.name];
    }
    if (typeof parsed === 'string' && parsed.length > 0) {
      return [parsed];
    }
  } catch {
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/\s*<.*>$/, '').trim())
      .filter(Boolean);
  }

  return [];
}

function getPackageName() {
  const packagePath = resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  return packageJson.name;
}
/**
 * 
 * @param {string} message 
 * @returns {never}
 */
function failLogin(message) {
  console.error(`\x1b[31m✖ ${message}\x1b[0m`);
  console.warn(`\x1b[33m⚠ You need to log in to npm: \`npm login\`\x1b[0m`);
  process.exit(1);
}

let whoami = '';
try {
  whoami = runCommand('npm whoami');
} catch {
  failLogin('Not logged in to npm.');
}

const looksLikeUsername = /^[\w-]+$/.test(whoami);
if (!looksLikeUsername) {
  failLogin(`npm whoami returned: ${whoami}`);
}

const packageName = getPackageName();
/** @type {string[]} */
let maintainers = [];
try {
  maintainers = getMaintainerUsernames(packageName);
} catch {
  failLogin(`Unable to read maintainers for ${packageName}.`);
}

const normalizedMaintainers = maintainers.map((name) => name.toLowerCase());
if (!normalizedMaintainers.includes(whoami.toLowerCase())) {
  failLogin(
    `Logged in as ${whoami}, but you are not a maintainer of ${packageName}.`
  );
}

console.log(`You are logged in as \`${whoami}\` (maintainer of \`${packageName}\`).`);
console.log('');
