# Refactoring Plan: i18n-Ready Architecture with Content Separation

**Goal:** Extract ALL user-facing copy into JSON locale files, implement proper i18n infrastructure, and separate presentation from business logic.

**Philosophy:**
- **Zero copy in source code** - All user-facing text lives in JSON files
- **ICU MessageFormat** - Proper interpolation and pluralization
- **Locale-first design** - English is just another locale
- **Namespaced keys** - Stable IDs like `cli.intro`, `error.noConfig`
- **No formatting in translations** - Colors/styles applied in code

**Target Architecture:**
```
create-p5/
├── index.js                    # Orchestrator only
├── locales/                    # ⭐ NEW: All translations
│   └── en/                     # English locale
│       ├── cli.json            # CLI messages (help, intro, outro)
│       ├── errors.json         # Error messages
│       ├── prompts.json        # Prompt text and options
│       ├── info.json           # Informational messages
│       └── notes.json          # Success summaries and tips
├── src/
│   ├── i18n/                   # ⭐ NEW: Internationalization layer
│   │   └── index.js            # Load locales, provide t() function
│   ├── operations/             # ⭐ NEW: Business logic (NO copy)
│   │   ├── scaffold.js         # Scaffolding logic
│   │   └── update.js           # Update operations
│   ├── ui/                     # ⭐ NEW: UI primitives (NO copy)
│   │   ├── display.js          # Display primitives
│   │   └── prompts.js          # Prompt primitives
│   ├── version.js              # Version fetching
│   ├── htmlManager.js          # HTML manipulation
│   ├── config.js               # Config management
│   ├── git.js                  # Git operations
│   ├── templateFetcher.js      # Template fetching
│   └── utils.js                # File utilities
```

---

## Architectural Layers

### Layer 1: Translations (Data) - locales/
**Purpose:** All user-facing text in JSON
**Contains:** Translation files organized by domain
**Format:** JSON with ICU MessageFormat
**Philosophy:** Pure data, namespaced keys, no logic

### Layer 2: i18n Infrastructure - src/i18n/
**Purpose:** Load translations and provide t() function
**Contains:** Locale loading, interpolation, pluralization
**Exports:** `t(key, vars)`, `setLocale(locale)`
**Philosophy:** Generic, reusable, no business logic

### Layer 3: UI Primitives - src/ui/
**Purpose:** Presentation mechanisms
**Contains:** Wrappers around @clack/prompts
**Uses:** i18n layer for text, applies colors/formatting
**Philosophy:** Mechanisms only, format-aware but content-free

### Layer 4: Operations (Business Logic) - src/operations/
**Purpose:** Application logic
**Contains:** Scaffolding, update workflows
**Uses:** UI primitives, t() for any dynamic messages
**Philosophy:** Pure logic, no inline copy

### Layer 5: Orchestration - index.js
**Purpose:** Route between operations
**Contains:** Command routing only
**Philosophy:** Minimal, delegates everything

---

## Stage 1: Create i18n Infrastructure (4 commits)

### Commit 1: Create locale files structure
**What:** Set up JSON translation files for English
**Files:** `locales/en/*.json` (new)

Create `locales/en/cli.json`:
```json
{
  "cli.brand": "create-p5",
  "cli.intro": " create-p5 ",
  "cli.help.usage": "\ncreate-p5 - Scaffolding tool for p5.js projects\n\nUSAGE:\n  npm create p5@latest [project-name] [options]\n  npx create-p5 [project-name] [options]\n  npx create-p5 update\n\nOPTIONS:\n  -t, --template <name>    Template to use (basic, instance, typescript, empty)\n  -v, --version <version>  p5.js version to use (e.g., 2.1.1 or latest)\n  -m, --mode <mode>        Delivery mode (cdn or local)\n  -g, --git                Initialize git repository\n  -y, --yes                Skip prompts and use defaults\n  -p, --include-prerelease Include pre-release versions (RC, beta, alpha)\n      --no-types           Skip TypeScript definitions download\n      --verbose            Show detailed logging\n  -h, --help               Show this help message\n\nEXAMPLES:\n  npm create p5@latest my-sketch\n  npm create p5@latest my-sketch -- --template typescript --mode cdn --git\n  npm create p5@latest -- --yes\n  npm create p5@latest -- --include-prerelease\n  npx create-p5 update\n"
}
```

Create `locales/en/errors.json`:
```json
{
  "error.existingProject.detected": "Existing p5.js project detected (p5-config.json found).",
  "error.existingProject.alreadyProject": "This directory is already a create-p5 project.",
  "error.existingProject.updateHint": "To update this project, use:",
  "error.existingProject.updateCommand": "  npx create-p5 update",

  "error.directoryExists": "Directory \"{path}\" already exists.",
  "error.directoryExistsSuggestion": "Suggestion: Choose a different path or remove the existing directory.",
  "error.currentDirNotEmpty": "Current directory is not empty.",
  "error.currentDirSuggestion": "Suggestion: Use a subdirectory or clean the current directory first.",

  "error.fetchVersions.failed": "Failed to fetch p5.js versions",
  "error.fetchVersions.troubleshooting": "Troubleshooting:",
  "error.fetchVersions.step1": "  1. Check your internet connection",
  "error.fetchVersions.step2": "  2. Verify that https://data.jsdelivr.com is accessible",
  "error.fetchVersions.step3": "  3. Try again in a few moments",

  "error.fetchTemplate": "Failed to fetch remote template \"{template}\": {error}",
  "error.cleanup": "Cleaning up...",

  "error.persistHelp.title": "If the problem persists:",
  "error.persistHelp.verbose": "• Try with --verbose flag for detailed output",
  "error.persistHelp.permissions": "• Check write permissions in the current directory",
  "error.persistHelp.issues": "• Report issues at https://github.com/sableraf/create-p5/issues",

  "error.update.noConfig": "No p5-config.json found. This does not appear to be a create-p5 project."
}
```

Create `locales/en/prompts.json`:
```json
{
  "prompt.projectPath.message": "Where should we create your p5.js sketch?",
  "prompt.projectPath.placeholder": ". (current directory)",
  "prompt.projectPath.error.absolutePath": "Please use a relative path (e.g., \"./my-sketch\" or \"my-sketch\")",
  "prompt.projectPath.error.invalidChars": "Path contains invalid characters",

  "prompt.template.message": "Select template:",
  "prompt.template.option.basic.label": "Basic",
  "prompt.template.option.basic.hint": "Standard p5.js with global mode (recommended for beginners)",
  "prompt.template.option.instance.label": "Instance Mode",
  "prompt.template.option.instance.hint": "Multiple sketches on one page, avoids global namespace",
  "prompt.template.option.typescript.label": "TypeScript",
  "prompt.template.option.typescript.hint": "TypeScript setup with type definitions",
  "prompt.template.option.empty.label": "Empty",
  "prompt.template.option.empty.hint": "Minimal HTML only, build your own structure",

  "prompt.version.message": "Select p5.js version:",
  "prompt.version.latestLabel": "{version} (latest)",

  "prompt.mode.message": "Select delivery mode:",
  "prompt.mode.option.cdn.label": "CDN",
  "prompt.mode.option.cdn.hint": "Load p5.js from jsdelivr CDN (recommended for most users)",
  "prompt.mode.option.local.label": "Local",
  "prompt.mode.option.local.hint": "Download p5.js files to your project (works offline)",

  "prompt.update.action.message": "What would you like to update?",
  "prompt.update.action.option.version.label": "Update p5.js version",
  "prompt.update.action.option.version.hint": "Change to a different version of p5.js",
  "prompt.update.action.option.mode.label": "Switch delivery mode",
  "prompt.update.action.option.mode.hint": "Switch between CDN and local file delivery",
  "prompt.update.action.option.cancel.label": "Cancel",
  "prompt.update.action.option.cancel.hint": "Exit without making changes",

  "prompt.update.deleteLib.message": "Delete the local lib/ directory?",

  "prompt.cancel.sketchCreation": "You cancelled the sketch creation"
}
```

Create `locales/en/info.json`:
```json
{
  "info.creatingIn": "Creating project in: {path}",
  "info.creatingInCurrent": "Creating project in: current directory",
  "info.verboseEnabled": "Verbose mode enabled",
  "info.includePrerelease": "Including pre-release versions (RC, beta, alpha)",
  "info.continueWithoutTypes": "Continuing without TypeScript definitions...",
  "info.skipTypes": "Skipping TypeScript definitions download (--no-types flag)",
  "info.stackTrace": "Stack trace:",

  "info.config.header": "Project configuration:",
  "info.config.projectName": "  Project name: {name}",
  "info.config.template": "  Template: {template}",
  "info.config.version": "  p5.js version: {version}",
  "info.config.mode": "  Delivery mode: {mode}",
  "info.config.git.yes": "  Git initialization: yes",
  "info.config.git.no": "  Git initialization: no",
  "info.config.types.yes": "  TypeScript definitions: yes",
  "info.config.types.no": "  TypeScript definitions: no",

  "info.usingTemplate": "Using template: {template}",
  "info.defaultTemplate": "Using default template: basic",
  "info.usingVersion": "Using p5.js version: {version}",
  "info.latestVersion": "Using latest p5.js version: {version}",
  "info.usingMode": "Using delivery mode: {mode}",
  "info.defaultMode": "Using default delivery mode: cdn",

  "info.update.cancelled": "Update cancelled.",
  "info.update.sameVersion": "Selected version is the same as current version. No changes made.",
  "info.update.updating": "Updating from version {oldVersion} to {newVersion}...",
  "info.update.switchingMode": "Switching from {oldMode} to {newMode} mode...",
  "info.update.downloadedFiles": "Downloaded new p5.js files to lib/",
  "info.update.updatedScript": "Updated script tag in index.html",
  "info.update.updatedTypes": "Updated TypeScript definitions to version {version}",
  "info.update.updatedGitignore": "Updated .gitignore to exclude lib/",
  "info.update.deletedLib": "Deleted lib/ directory",
  "info.update.libNotFound": "lib/ directory not found or already deleted",
  "info.update.libKept": "lib/ directory kept (you can delete it manually)",
  "info.update.modeUpdated": "Delivery mode updated from {oldMode} to {newMode}"
}
```

Create `locales/en/notes.json`:
```json
{
  "note.projectSummary.title": "Project Summary",
  "note.projectSummary.name": "Name:     {name}",
  "note.projectSummary.template": "Template: {template}",
  "note.projectSummary.version": "p5.js:    {version}",
  "note.projectSummary.mode": "Mode:     {mode}",
  "note.projectSummary.types": "Types:    {version}",
  "note.projectSummary.git": "Git:      initialized",

  "note.nextSteps.title": "Next Steps",
  "note.nextSteps.step1": "1. cd {projectName}",
  "note.nextSteps.step2": "2. Open index.html in your browser",
  "note.nextSteps.documentation": "Documentation:",
  "note.nextSteps.reference": "• p5.js reference: https://p5js.org/reference/",
  "note.nextSteps.examples": "• Examples: https://p5js.org/examples/",
  "note.nextSteps.update": "• Update project: npx create-p5 update",

  "note.typescriptTips.title": "TypeScript Tips",
  "note.typescriptTips.editor": "• Use a TypeScript-aware editor like VS Code",
  "note.typescriptTips.install": "• Install TypeScript: npm install -g typescript",
  "note.typescriptTips.compile": "• Compile: tsc sketch.ts",

  "note.instanceTips.title": "Instance Mode Tips",
  "note.instanceTips.multiple": "• Multiple sketches can run on the same page",
  "note.instanceTips.usage": "• Use new p5(sketch, container) to create instances",

  "note.gitTips.title": "Git Tips",
  "note.gitTips.firstCommit": "• Make your first commit: git add . && git commit -m \"Initial commit\"",
  "note.gitTips.libIgnored": "• lib/ directory is already in .gitignore",

  "note.update.currentConfig.title": "Current project configuration",
  "note.update.currentConfig.version": "p5.js version: {version}",
  "note.update.currentConfig.mode": "Delivery mode: {mode}",
  "note.update.currentConfig.template": "Template: {template}",
  "note.update.currentConfig.types": "TypeScript definitions: {version}",
  "note.update.currentConfig.typesNone": "TypeScript definitions: none",
  "note.update.currentConfig.lastUpdated": "Last updated: {timestamp}",

  "note.update.versionSummary.title": "Version updated successfully!",
  "note.update.versionSummary.oldVersion": "Old version: {version}",
  "note.update.versionSummary.newVersion": "New version: {version}",
  "note.update.versionSummary.types": "TypeScript definitions: {version}",

  "note.success.created": "✓ Project created successfully!",
  "note.success.failed": "✗ Project creation failed",

  "note.verbose.remoteTemplateSpec": "  Remote template spec: {spec}",
  "note.verbose.targetPath": "  Target path: {path}",
  "note.verbose.templatePath": "  Template path: {path}"
}
```

Create `locales/en/spinners.json`:
```json
{
  "spinner.fetchingVersions": "Fetching p5.js versions",
  "spinner.fetchedVersions": "✓ Fetched available p5.js versions",
  "spinner.failedVersions": "✗ Failed to fetch versions",

  "spinner.copyingTemplate": "Copying template files",
  "spinner.copiedTemplate": "✓ Copied template files",

  "spinner.fetchingRemoteTemplate": "Fetching remote template",
  "spinner.fetchedRemoteTemplate": "✓ Fetched remote template",
  "spinner.failedRemoteTemplate": "✗ Failed to fetch remote template",

  "spinner.initializingGit": "Initializing git repository",
  "spinner.initializedGit": "✓ Initialized git repository",

  "spinner.downloadingP5File": "Downloading {filename}...",
  "spinner.downloadedP5": "p5.js files downloaded successfully",
  "spinner.failedP5": "Failed to download p5.js files",

  "spinner.downloadingTypes": "Downloading TypeScript definitions...",
  "spinner.downloadedTypes": "TypeScript definitions downloaded (v{version})",
  "spinner.failedTypes": "Failed to download TypeScript definitions",

  "spinner.cleaningUp": "Cleaning up incomplete project directory",
  "spinner.cleanedUp": "✓ Cleaned up incomplete project"
}
```

**Test:** Verify all JSON files parse correctly

### Commit 2: Create i18n loader
**What:** Minimal i18n infrastructure with interpolation
**Files:** `src/i18n/index.js` (new)

```javascript
/**
 * Internationalization (i18n) layer
 * Loads locale files and provides translation function
 *
 * Philosophy: Generic, reusable, no business logic
 * Format: JSON files with ICU-style interpolation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {Record<string, string>} */
let messages = {};

/** @type {string} */
let currentLocale = 'en';

/**
 * Load all translation files for a given locale
 * @param {string} locale - Locale code (e.g., 'en', 'fr', 'es')
 * @returns {Record<string, string>} All messages for this locale
 */
function loadMessages(locale) {
  const localeDir = path.join(__dirname, '..', '..', 'locales', locale);

  const result = {};

  // Fallback to English if locale directory doesn't exist
  if (!fs.existsSync(localeDir)) {
    if (locale !== 'en') {
      console.warn(`Locale ${locale} not found, falling back to English`);
      return loadMessages('en');
    }
    return {};
  }

  // Load all JSON files in the locale directory
  const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(localeDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);
      Object.assign(result, json);
    } catch (error) {
      console.error(`Failed to load ${filePath}:`, error.message);
    }
  }

  return result;
}

/**
 * Set the current locale and load its messages
 * @param {string} locale - Locale code (e.g., 'en', 'fr', 'es')
 */
export function setLocale(locale) {
  currentLocale = locale;
  messages = loadMessages(locale);
}

/**
 * Simple interpolation: replaces {name} with vars.name
 * @param {string} template - Template string with {placeholders}
 * @param {Record<string, any>} vars - Variables to interpolate
 * @returns {string} Interpolated string
 */
function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value == null ? match : String(value);
  });
}

/**
 * Translate a key with optional variable interpolation
 * @param {string} key - Translation key (e.g., 'cli.intro', 'error.notFound')
 * @param {Record<string, any>} [vars={}] - Variables for interpolation
 * @returns {string} Translated and interpolated string
 *
 * @example
 * t('error.directoryExists', { path: './my-sketch' })
 * // => "Directory "./my-sketch" already exists."
 *
 * @example
 * t('prompt.version.latestLabel', { version: '1.9.0' })
 * // => "1.9.0 (latest)"
 */
export function t(key, vars = {}) {
  const template = messages[key];

  if (!template) {
    console.warn(`Translation key not found: ${key}`);
    return key; // Return the key itself as fallback
  }

  return interpolate(template, vars);
}

/**
 * Get current locale
 * @returns {string} Current locale code
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Detect locale from environment variables
 * Checks LC_ALL, LC_MESSAGES, LANG in order
 * @returns {string} Detected locale code (defaults to 'en')
 */
export function detectLocale() {
  const env = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '';

  // Parse formats like: en_US.UTF-8 => en, fr_FR => fr, pt-BR => pt-BR
  const match = env.match(/^([a-z]{2})([_-][A-Z]{2})?/i);

  if (match) {
    return match[1].toLowerCase(); // Return just language code (en, fr, es, etc.)
  }

  return 'en';
}

// Initialize with detected or default locale
setLocale(detectLocale());
```

**Test:** Verify i18n loads and t() works

### Commit 3: Create UI display primitives
**What:** Generic display functions that use i18n
**Files:** `src/ui/display.js` (new)

```javascript
/**
 * Display primitives - UI output functions
 * Philosophy: Mechanisms only, content from i18n
 * Applies formatting (colors) but no hardcoded text
 */

import * as p from '@clack/prompts';
import { blue, red, green, cyan, bgMagenta, white } from 'kolorist';
import { t } from '../i18n/index.js';

/**
 * Show intro banner with branding
 */
export function intro() {
  p.intro(bgMagenta(white(t('cli.intro'))));
}

/**
 * Show outro message
 * @param {string} message - The outro message (already translated)
 */
export function outro(message) {
  p.outro(message);
}

/**
 * Show cancellation message and exit
 * @param {string} key - Translation key for cancellation message
 */
export function cancel(key) {
  p.cancel(t(key));
  process.exit(0);
}

/**
 * Log a plain message (no formatting)
 * @param {string} text - Pre-formatted text (can include colors)
 */
export function message(text) {
  p.log.message(text);
}

/**
 * Log an info message
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function info(key, vars) {
  p.log.info(t(key, vars));
}

/**
 * Log a success message with green color
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function success(key, vars) {
  p.log.success(t(key, vars));
}

/**
 * Log an error message with red color
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function error(key, vars) {
  p.log.error(t(key, vars));
}

/**
 * Log a warning message
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function warn(key, vars) {
  p.log.warn(t(key, vars));
}

/**
 * Display a note box with title and lines
 * @param {string[]} lineKeys - Array of translation keys for content lines
 * @param {string} titleKey - Translation key for title
 * @param {Record<string, any>} [vars] - Variables for interpolation (applied to all)
 */
export function note(lineKeys, titleKey, vars = {}) {
  const content = lineKeys.map(key => t(key, vars)).join('\n');
  const title = t(titleKey);
  p.note(content, title);
}

/**
 * Create and manage a spinner
 * @param {string} key - Translation key for initial message
 * @param {Record<string, any>} [vars] - Variables for interpolation
 * @returns {Object} Spinner object with message(key, vars) and stop(key, vars) methods
 */
export function spinner(key, vars) {
  const s = p.spinner();
  s.start(t(key, vars));

  // Wrap methods to use translation keys
  const originalMessage = s.message.bind(s);
  const originalStop = s.stop.bind(s);

  s.message = (key, vars) => originalMessage(t(key, vars));
  s.stop = (key, vars) => originalStop(t(key, vars));

  return s;
}

/**
 * Apply blue color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleBlue(text) {
  return blue(text);
}

/**
 * Apply green color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleGreen(text) {
  return green(text);
}

/**
 * Apply red color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleRed(text) {
  return red(text);
}

/**
 * Apply cyan color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleCyan(text) {
  return cyan(text);
}
```

**Test:** Verify display functions work with i18n

### Commit 4: Create UI prompt primitives
**What:** Generic prompt functions that use i18n
**Files:** `src/ui/prompts.js` (new)

```javascript
/**
 * Prompt primitives - Interactive input functions
 * Philosophy: Mechanisms only, content from i18n
 * All text comes from locale files
 */

import * as p from '@clack/prompts';
import { t } from '../i18n/index.js';
import { validateProjectPath as validatePath } from '../utils.js';

/**
 * Check if user cancelled a prompt
 * @param {any} value - The prompt response value
 * @returns {boolean} True if cancelled
 */
export function isCancel(value) {
  return p.isCancel(value);
}

/**
 * Prompt for project path
 * @param {string} initialValue - Initial/default value
 * @returns {Promise<string>} User's input
 */
export async function promptProjectPath(initialValue) {
  return await p.text({
    message: t('prompt.projectPath.message'),
    placeholder: t('prompt.projectPath.placeholder'),
    initialValue,
    validate: (value) => {
      const trimmed = value.trim();

      // Allow current directory
      if (trimmed === '.' || trimmed === '') {
        return;
      }

      // Enforce relative paths
      if (trimmed.startsWith('/') || /^[A-Za-z]:/.test(trimmed)) {
        return t('prompt.projectPath.error.absolutePath');
      }

      // Check for invalid characters
      if (/[<>:"|?*]/.test(trimmed)) {
        return t('prompt.projectPath.error.invalidChars');
      }
    }
  });
}

/**
 * Prompt for template selection
 * @returns {Promise<string>} Selected template value
 */
export async function promptTemplate() {
  return await p.select({
    message: t('prompt.template.message'),
    options: [
      {
        value: 'basic',
        label: t('prompt.template.option.basic.label'),
        hint: t('prompt.template.option.basic.hint')
      },
      {
        value: 'instance',
        label: t('prompt.template.option.instance.label'),
        hint: t('prompt.template.option.instance.hint')
      },
      {
        value: 'typescript',
        label: t('prompt.template.option.typescript.label'),
        hint: t('prompt.template.option.typescript.hint')
      },
      {
        value: 'empty',
        label: t('prompt.template.option.empty.label'),
        hint: t('prompt.template.option.empty.hint')
      }
    ]
  });
}

/**
 * Prompt for version selection
 * @param {string[]} versions - Available versions
 * @param {string} latest - Latest version
 * @returns {Promise<string>} Selected version
 */
export async function promptVersion(versions, latest) {
  return await p.select({
    message: t('prompt.version.message'),
    options: versions.map(v => ({
      value: v,
      label: v === latest ? t('prompt.version.latestLabel', { version: v }) : v
    })),
    maxItems: 7
  });
}

/**
 * Prompt for delivery mode selection
 * @returns {Promise<string>} Selected mode ('cdn' or 'local')
 */
export async function promptMode() {
  return await p.select({
    message: t('prompt.mode.message'),
    options: [
      {
        value: 'cdn',
        label: t('prompt.mode.option.cdn.label'),
        hint: t('prompt.mode.option.cdn.hint')
      },
      {
        value: 'local',
        label: t('prompt.mode.option.local.label'),
        hint: t('prompt.mode.option.local.hint')
      }
    ]
  });
}

/**
 * Prompt for update action selection
 * @returns {Promise<string>} Selected action ('version', 'mode', or 'cancel')
 */
export async function promptUpdateAction() {
  return await p.select({
    message: t('prompt.update.action.message'),
    options: [
      {
        value: 'version',
        label: t('prompt.update.action.option.version.label'),
        hint: t('prompt.update.action.option.version.hint')
      },
      {
        value: 'mode',
        label: t('prompt.update.action.option.mode.label'),
        hint: t('prompt.update.action.option.mode.hint')
      },
      {
        value: 'cancel',
        label: t('prompt.update.action.option.cancel.label'),
        hint: t('prompt.update.action.option.cancel.hint')
      }
    ]
  });
}

/**
 * Confirm deletion of lib directory
 * @returns {Promise<boolean>} User's confirmation
 */
export async function confirmDeleteLib() {
  return await p.confirm({
    message: t('prompt.update.deleteLib.message'),
    initialValue: false
  });
}
```

**Test:** Verify prompts work with i18n

---

## Stage 2: Extract Scaffold Operation (3 commits)

### Commit 1: Create src/operations/scaffold.js skeleton
**What:** Set up operations folder structure
**Files:** `src/operations/scaffold.js` (new)

```javascript
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
import { /* ... */ } from '../utils.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from '../version.js';
// ... other imports

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main scaffolding function
 * @param {Object} args - Parsed command line arguments
 * @returns {Promise<void>}
 */
export async function scaffold(args) {
  // Will implement in next commit
}
```

**Test:** Verify file structure

### Commit 2: Move scaffolding logic to scaffold.js
**What:** Extract all scaffolding code from index.js
**Files:** `index.js`, `src/operations/scaffold.js`

Move entire workflow using i18n:
```javascript
// Instead of: p.log.info('Creating project...')
display.info('info.creatingIn', { path: projectPath });

// Instead of: const template = await p.select({ message: 'Select...', ... })
const template = await prompts.promptTemplate();

// Instead of: p.note(summary, 'Project Summary')
display.note([
  'note.projectSummary.name',
  'note.projectSummary.template',
  // ...
], 'note.projectSummary.title', { name: projectName, template, version, mode });
```

**Test:** Scaffolding works end-to-end

### Commit 3: Simplify index.js to routing only
**What:** Clean up index.js
**Files:** `index.js`

```javascript
import path from 'path';
import minimist from 'minimist';
import { scaffold } from './src/operations/scaffold.js';
import { update } from './src/operations/update.js';
import { configExists } from './src/config.js';
import { t } from './src/i18n/index.js';
import * as display from './src/ui/display.js';

async function main() {
  const args = minimist(process.argv.slice(2), {
    boolean: ['yes', 'git', 'no-types', 'help', 'verbose', 'include-prerelease'],
    string: ['template', 'version', 'mode', 'lang', 'locale'],
    alias: {
      y: 'yes',
      g: 'git',
      t: 'template',
      v: 'version',
      m: 'mode',
      h: 'help',
      p: 'include-prerelease',
      l: 'lang'
    }
  });

  // Handle --help
  if (args.help) {
    display.message(t('cli.help.usage'));
    process.exit(0);
  }

  // Handle update command
  if (args._[0] === 'update') {
    await update();
    return;
  }

  // Check for existing project
  const currentConfigPath = path.join(process.cwd(), 'p5-config.json');
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
```

**Test:** Both commands work

---

## Stage 3: Refactor Update Operation (2 commits)

### Commit 1: Move src/update.js → src/operations/update.js
**What:** File move only
**Files:** Move file, update imports

```bash
mkdir -p src/operations
git mv src/update.js src/operations/update.js
```

**Test:** Update command still works

### Commit 2: Refactor update.js to use i18n
**What:** Replace all inline copy
**Files:** `src/operations/update.js`

```javascript
import { t } from '../i18n/index.js';
import * as display from '../ui/display.js';
import * as prompts from '../ui/prompts.js';

// Instead of: p.log.error('No config found')
display.error('error.update.noConfig');

// Instead of: p.note(`version: ${config.version}...`, 'Current Config')
display.note([
  'note.update.currentConfig.version',
  'note.update.currentConfig.mode',
  'note.update.currentConfig.template',
  config.typeDefsVersion ? 'note.update.currentConfig.types' : 'note.update.currentConfig.typesNone',
  'note.update.currentConfig.lastUpdated'
], 'note.update.currentConfig.title', config);

// Instead of: await p.select({ message: 'What to update?', ... })
const action = await prompts.promptUpdateAction();
```

**Test:** Update workflow works

---

## Stage 4: Update Other Modules (3 commits)

### Commit 1: Update version.js to use i18n
**What:** Remove spinner messages
**Files:** `src/version.js`

```javascript
// Instead of: spinner.message('Downloading p5.js...')
spinner.message('spinner.downloadingP5File', { filename: 'p5.js' });
spinner.stop('spinner.downloadedP5');
```

**Test:** Downloads work

### Commit 2: Move generateProjectName helper
**What:** Move to utils.js
**Files:** `src/prompts.js` → `src/utils.js`

Move `generateProjectName` - it's not a prompt primitive

**Test:** Name generation works

### Commit 3: Remove old src/prompts.js
**What:** Delete legacy file, all functionality now in ui/prompts.js
**Files:** `src/prompts.js` (delete)

**Test:** All tests pass

---

## Stage 5: Documentation (2 commits)

### Commit 1: Update CLAUDE.md
**What:** Document new architecture
**Files:** `CLAUDE.md`

Add sections:
- i18n architecture (`locales/`, translation keys)
- How to add new messages
- How to add new locales (future)
- Layer separation (translations → i18n → UI → operations)

**Test:** Review documentation

### Commit 2: Add JSDoc to i18n and UI layers
**What:** Document modules
**Files:** `src/i18n/index.js`, `src/ui/display.js`, `src/ui/prompts.js`

**Test:** Final verification

---

## Benefits of This Architecture

### ✅ Complete i18n Readiness
Adding French is just:
```bash
cp -r locales/en locales/fr
# Edit locales/fr/*.json
```

### ✅ Zero Copy in Source
All user-facing text lives in JSON files with stable keys

### ✅ Proper Separation
- `locales/` = What to say (data)
- `src/i18n/` = How to load it (infrastructure)
- `src/ui/` = How to display it (presentation)
- `src/operations/` = What to do (logic)

### ✅ Easy Maintenance
- Edit copy: change JSON files
- Add feature: add keys, use t()
- No mixing concerns

---

## Testing Checklist

After each stage:
- [ ] Interactive mode works
- [ ] Non-interactive mode works
- [ ] Help text displays
- [ ] Update command works
- [ ] All messages from JSON
- [ ] Colors/formatting applied correctly

Final:
- [ ] All copy in locales/en/
- [ ] Zero hardcoded text in src/
- [ ] i18n infrastructure works
- [ ] All tests pass
- [ ] Documentation complete

---

## Time Estimate

| Stage | Focus | Commits | Time |
|-------|-------|---------|------|
| 1 | i18n infrastructure + JSON files | 4 | 4-5 hours |
| 2 | Extract scaffold.js | 3 | 2-3 hours |
| 3 | Refactor update.js | 2 | 1-2 hours |
| 4 | Update other modules | 3 | 1-2 hours |
| 5 | Documentation | 2 | 1 hour |
| **TOTAL** | | **14** | **9-13 hours** |

---

**Golden Rule:** User-facing copy is data in JSON files, not code.
