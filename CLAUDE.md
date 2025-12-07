# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

create-p5 is an npm scaffolding tool that enables users to quickly create and manage p5.js projects using the `npm create` convention. It provides both interactive and non-interactive modes for project creation, along with utilities to update existing projects safely.

**Package name**: `create-p5`
**Type**: npm create package (used via `npm create p5@latest`)
**Target audience**: Creative coders, educators, students, artists using p5.js

## Project Structure (Target Architecture)

```
create-p5/

├── index.js                 # Entry point - routing only
├── package.json
├── locales/                 # Translation files (i18n)
│   └── en/                  # English locale
│       ├── cli.json         # CLI messages (help, intro, outro)
│       ├── errors.json      # Error messages
│       ├── prompts.json     # Prompt text and options
│       ├── info.json        # Informational messages
│       ├── notes.json       # Success summaries and tips
│       └── spinners.json    # Loading messages
├── docs/
│   ├── DOCUMENTATION_GUIDELINES.md   # Coding standards and documentation practices
│   ├── PRODUCT_REQUIREMENTS.md       # High-level product requirements and features
│   └── WORKFLOW_GUIDELINES.md        # Development workflow and best practices
├── src/
│   ├── i18n/                # Internationalization layer
│   │   └── index.js         # Load locales, provide t() function
│   ├── ui/                  # UI primitives (NO copy)
│   │   ├── display.js       # Display primitives (intro, outro, info, etc.)
│   │   └── prompts.js       # Prompt primitives (template, version, mode, etc.)
│   ├── operations/          # Business logic (NO copy)
│   │   ├── scaffold.js      # New project creation workflow
│   │   └── update.js        # Update existing projects workflow
│   ├── config.js            # p5-config.json management
│   ├── version.js           # Version fetching from jsdelivr
│   ├── htmlManager.js       # HTML manipulation and script tag injection
│   ├── templateFetcher.js   # Remote template fetching
│   ├── git.js               # Git operations
│   └── utils.js             # Utilities (validation, file ops, etc.)
├── templates/
│   ├── basic-global-js/     # JavaScript + Global mode
│   ├── basic-global-ts/     # TypeScript + Global mode
│   ├── basic-instance-js/   # JavaScript + Instance mode
│   └── basic-instance-ts/   # TypeScript + Instance mode
├── tests/
└── types/
    └── default/
        └── v1/
            └── global.d.ts   # Minimal ATA type definitions for p5.js 1.x global-mode
            └── instance.d.ts   # Minimal ATA type definitions for p5.js 1.x instance-mode
```

## Key Dependencies

**Production:**
- `@clack/prompts` - Interactive prompts (https://bomb.sh/docs/clack/packages/prompts/)
- `kolorist` - Terminal colors
- `minimist` - Argument parsing
- `linkedom` - Fast, standards-compliant HTML DOM parser for Node.js
- `degit` - GitHub template cloning (community templates)

**Development:**
- `vitest` - Testing framework
- `prettier` - Code formatting
- `eslint` - Linting

## Core Functionality

### 1. Scaffolding New Projects
Entry point in `cli.js` detects if running in existing project (checks for `p5-config.json`) or creating new project. The `scaffold.js` module handles:
1. Parse arguments or run interactive prompts
2. Copy selected template
3. Inject p5.js script tag with chosen version/mode (CDN or local)
4. Download TypeScript definitions to `types/` directory
5. Create `p5-config.json` metadata file
6. Optionally run `git init`

### 2. Updating Existing Projects
The `update.js` module handles:
- Version updates (updates script tag or downloads new files)
- Mode switching (CDN ↔ local)
- TypeScript definitions updates
- Preserves user code, only modifies infrastructure

### 3. HTML Manipulation System
Uses `linkedom` for proper DOM parsing and manipulation (not regex-based string replacement).

**Three-tier script tag injection strategy:**
1. **Update existing p5.js script** - Detects and updates existing p5.js script tags from any CDN provider, preserving user preferences (minification, CDN choice)
2. **Replace marker comment** - Replaces `<!-- P5JS_SCRIPT_TAG -->` marker in templates with actual script tag
3. **Insert into head** - If no script or marker found, inserts script tag at beginning of `<head>`

**Multi-CDN Support:**
- jsdelivr: `https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js`
- cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/{version}/p5.js`
- unpkg: `https://unpkg.com/p5@{version}/lib/p5.js`
- Local: `/lib/p5.js` (downloads to `lib/` directory)

The HTMLManager detects existing CDN providers and preserves them during updates.

### 4. Version Management
The `version.js` module:
- Fetches available p5.js versions from `https://data.jsdelivr.com/v1/package/npm/p5` (note: singular "package")
- Latest version accessed via `data.tags.latest`
- All versions accessed via `data.versions` array
- Shows latest 15 versions in interactive mode
- Downloads p5.js files from jsdelivr CDN when using local mode
- Uses a **simple two-tier strategy** for TypeScript definitions:
  - **p5.js 1.x**: Copies minimal `global.d.ts` (for global mode) or `p5.d.ts` (for instance mode) from repo that tells VS Code to auto-acquire from `@types/p5`
  - **p5.js 2.x (2.0.2+)**: Downloads bundled types from p5 package itself
  - **p5.js 2.0.0-2.0.1**: Hardcoded fallback to download types from 2.0.2

## Development Workflow

### Philosophy
Follow incremental development in 6-10 stages with 2-4 atomic commits per stage:
1. **Proof of Concept** - Hardcoded, single feature, validates approach (only if new architecture)
2. **Dynamic Input** - Real data, user choices
3. **Persistence** - Save/load state
4. **Alternative Modes** - Different paths through the system
5. **Extended Features** - Non-core functionality
6. **Refactoring** - DRY, modularity (only after features work)
7. **Error Handling** - Validation, edge cases
8. **Documentation** - README, examples

### Commit Guidelines
- **1-5 files changed** per commit
- **15-60 minutes** to implement
- **One purpose**: add feature OR refactor OR fix (not multiple)
- **Leaves code working** - must be testable after commit
- **Descriptive message** - concise but informative
- **Renaming/moving files/folders MUST be a separate commit** - never combined with other changes.

Format: `type: short description` where type is `feat`, `fix`, `refactor`, `docs`, `test`, or `style`

### Checkpoints
After each stage, ensure something is demo-able and working before proceeding. STOP at checkpoints for approval.

After approval, save the checkpoint summary in `docs/CHECKPOINTS.md`.

## Code Documentation Standards

**All functions and methods MUST have JSDoc comments** with:
- Description of what the function does
- `@param` tags for each parameter with type and description
- `@returns` tag with return type and description

Example:
```javascript
/**
 * Downloads TypeScript type definitions for p5.js from jsdelivr CDN.
 * Falls back to the latest version if the specified version's types are not found.
 *
 * @param {string} version - The p5.js version to download type definitions for
 * @param {boolean} [verbose=false] - Whether to log verbose output
 * @returns {Promise<string>} The actual version of the type definitions downloaded
 */
async function downloadTypes(version, verbose = false) {
  // Implementation...
}
```

## Key Technical Details

### p5-config.json Schema
Created during scaffolding, used by update commands. Stores minimal metadata about the project setup:
```json
{
  "version": "1.9.0",
  "mode": "cdn",
  "language": "javascript",
  "p5Mode": "global",
  "typeDefsVersion": "1.7.7",
  "lastUpdated": "2025-12-06T10:30:00Z"
}
```

**Fields:**
- `version` - The p5.js version currently in use
- `mode` - Delivery mode: "cdn" or "local"
- `language` - Programming language: "javascript" or "typescript" (null for community templates)
- `p5Mode` - p5.js mode: "global" or "instance" (null for community templates)
- `typeDefsVersion` - Version of TypeScript definitions installed (null if none)
- `lastUpdated` - ISO timestamp of last modification

### Node.js Requirements
- **Minimum**: Node.js 18.0.0+ (for native fetch API and modern ESM support)
- **Package Managers**: npm 7+, yarn 1.22+, pnpm 8+, bun 1.0+

### Key Architectural Patterns

#### 1. Dependency Injection
Components receive dependencies through constructor parameters rather than creating them internally:
```javascript
// ConfigManager depends on FileManager
const fileManager = new FileManager();
const configManager = new ConfigManager(fileManager, 'sketch/p5-config.json');
```

#### 2. Single Responsibility Principle
Each class has one clear purpose:
- **FileManager** - File I/O operations only
- **HTMLManager** - HTML parsing and manipulation only
- **VersionProvider** - Version data fetching only
- **ConfigManager** - Configuration persistence only
- **PromptProvider** - User interaction only

#### 3. Facade Pattern for External Libraries
PromptProvider wraps `@clack/prompts` with domain-specific methods, making it easy to swap prompt libraries later without changing business logic.

#### 4. DOM Manipulation via linkedom
HTMLManager uses linkedom's DOM API (not regex) for reliable HTML manipulation:
- Parses HTML into proper DOM tree
- Uses `querySelectorAll`, `createElement`, `setAttribute`, etc.
- Serializes back to HTML string with DOCTYPE

#### 5. Pattern Matching for Flexibility
HTMLManager uses regex patterns to detect p5.js script tags from multiple CDN providers, enabling seamless updates regardless of how the project was originally created.

### HTMLManager Implementation Details

**Script Tag Detection Patterns:**
```javascript
static P5_PATTERNS = [
  /^https?:\/\/cdn\.jsdelivr\.net\/npm\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
  /^https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/([^/]+)\/p5\.(?:min\.)?js$/,
  /^https?:\/\/unpkg\.com\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
  /^\.?\/?\bsketch\/lib\/p5(?:@([^/]+))?\.(min\.)?js$/,
  /^\.?\/?\blib\/p5(?:@([^/]+))?\.(min\.)?js$/
];
```

**Capture Groups:**
- Group 1: Version string (e.g., "1.9.0")
- Group 2: Minification indicator ("min." if present)

**Update Strategy:**
1. `findP5Script()` - Searches all `<script>` tags, returns version, minification status, and CDN provider
2. `buildScriptURL()` - Constructs new script URL preserving user preferences (minified, CDN choice)
3. `updateP5Script()` - Updates existing tag, replaces marker, or inserts new script in that priority order
4. `serialize()` - Converts DOM back to HTML string with proper DOCTYPE

**Marker Comment:**
Built-in Templates in `templates/` should use `<!-- P5JS_SCRIPT_TAG -->` as a placeholder in `index.html`. The HTMLManager will replace this with the appropriate script tag during scaffolding.

### VersionProvider Implementation Details

The VersionProvider demonstrates the correct way to interact with the jsdelivr API:

**CDN and API Endpoints:**
```javascript
const cdnUrl = 'https://cdn.jsdelivr.net/npm/';
const apiUrl = 'https://data.jsdelivr.com/v1/package/npm/';
```

**Fetching Versions:**
```javascript
// Get all a list of all p5.js versions from https://data.jsdelivr.com/v1/package/npm/p5
const response = await fetch(`${apiUrl}p5`);
const data = await response.json();
const versions = data.versions;  // Array of version strings
const latest = data.tags.latest;  // Latest stable version
```

**Key Methods:**
- `fetchVersions(includePrerelease)` - Returns all available p5.js versions
- `parseVersion(version)` - Parses semver string into components (major, minor, patch, prerelease)
- `getTypesStrategy(version)` - Determines whether to use @types/p5 or bundled types
- `downloadP5Files(version, targetDir, spinner)` - Downloads p5.js library files for local mode
- `downloadTypeDefinitions(p5Version, targetDir, spinner, template)` - Downloads or copies TypeScript definitions using simple two-tier strategy

### FileManager Implementation Details

The FileManager provides a comprehensive file I/O abstraction layer:

**Core Operations:**
- `readHTML()` / `writeHTML()` - HTML file operations with UTF-8 encoding
- `readJSON()` / `writeJSON()` - JSON parsing and serialization with formatting
- `createDir()` - Recursive directory creation
- `exists()` - Non-throwing existence checks
- `listDir()` - Directory listing with graceful error handling
- `deleteFile()` / `deleteDir()` - File and directory removal

**Download Operations:**
```javascript
// Simple download (throws on HTTP errors)
await fileManager.downloadFile(url, targetPath);

// Download with status check
const response = await fileManager.downloadFileWithCheck(url);
if (response.ok) {
  const content = await response.text();
  // Process content
}
```

**Design Principles:**
- All paths are absolute (no relative path assumptions)
- Async/await for all I/O operations
- Graceful error handling (returns false/empty array instead of throwing where appropriate)
- UTF-8 encoding by default

### TypeScript Type Definitions Strategy

The tool uses a **simple two-tier strategy** for TypeScript definitions based on p5.js major version (with modifications for global-mode / instance-mode).

**For p5.js 1.x global-mode**
Copies minimal `global.d.ts` from `types/default/v1/global.d.ts` in the repo. This file tells VS Code to auto-acquire type definitions from the `@types/p5` package and makes them available globally.

```javascript
// Contents of types/default/v1/global.d.ts
import * as p5Global from "p5/global";
import module from "p5";
export = module;
export as namespace p5;
```
**For p5.js 1.x instance-mode**
Copies minimal `instance.d.ts` from `types/default/v1/instance.d.ts` in the repo. This file tells VS Code to auto-acquire type definitions from the `@types/p5` package and imports globally _only_ the type for the `p5` module.

```javascript
// Contents of types/default/v1/instance.d.ts
import module from "p5";
export = module;
export as namespace p5;
```

- **No network requests needed** - file is bundled with create-p5
- **No version matching** - VS Code automatically uses latest compatible @types/p5
- **Always returns `1.7.7`** as typeDefsVersion for reference only

**For p5.js 2.x (2.0.2+):**
Downloads bundled types directly from the p5 package:
```
https://cdn.jsdelivr.net/npm/p5@{version}/types/global.d.ts  # For global mode
https://cdn.jsdelivr.net/npm/p5@{version}/types/p5.d.ts      # For instance mode
```
- **Hardcoded fallback**: Versions 2.0.0, 2.0.1, and 2.0.0-* pre-releases use types from 2.0.2
- **No validation** - downloads directly from CDN, fails fast if types don't exist
- **Returns actual version used** (e.g., "2.0.2" for 2.0.0, or exact version for 2.0.3+)

**Implementation:**
- `getTypesStrategy(version)` determines which strategy to use based on major version
- Returns `{ useTypesPackage: boolean, reason: string }`
- `downloadTypeDefinitions(p5Version, targetDir, spinner, template)` executes the appropriate strategy
- Stores actual types version in `typeDefsVersion` field of `p5-config.json`
- **No user prompts** - fully deterministic based on version number
- **No validation requests** - faster execution, simpler code

### Download URLs for Local Mode

When downloading p5.js files for local mode, use the jsdelivr CDN:

**p5.js library files:**
```
https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js
https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.min.js
```

### Usage Patterns
```bash
# Interactive mode
npm create p5@latest

# Non-interactive with flags
npm create p5@latest my-sketch -- --language typescript --p5-mode instance --mode cdn --yes

# With community template
npm create p5@latest my-sketch -- --template user/repo --yes

# Update existing project
npx create-p5 update --version 1.10.0

# Switch delivery mode
npx create-p5 mode local
```

## Internationalization (i18n) Architecture

create-p5 uses a complete i18n-ready architecture with all user-facing text extracted into JSON translation files.

### Architecture Overview

**Four-Layer Separation:**
1. **Translation Data** (`locales/`) - Pure JSON data files
2. **i18n Infrastructure** (`src/i18n/`) - Translation loading and interpolation
3. **UI Primitives** (`src/ui/`) - Presentation mechanisms
4. **Business Logic** (`src/operations/`) - Application workflows

### Translation Files

All user-facing text lives in `locales/en/*.json`:

```
locales/en/
├── cli.json         # CLI messages, help text, branding
├── errors.json      # Error messages and troubleshooting
├── prompts.json     # Interactive prompt text and validation
├── info.json        # Informational messages and status updates
├── notes.json       # Success summaries, tips, project info
└── spinners.json    # Loading messages and completion states
```

**Translation Key Format:**
- Use dot notation: `category.subcategory.name`
- Examples: `error.fetchVersions.failed`, `note.projectSummary.title`
- Stable keys: never change keys after creation

**Interpolation:**
```json
{
  "error.directoryExists": "Directory \"{path}\" already exists.",
  "prompt.version.latestLabel": "{version} (latest)"
}
```

Usage:
```javascript
t('error.directoryExists', { path: './my-sketch' })
// => "Directory "./my-sketch" already exists."
```

### i18n Infrastructure (src/i18n/)

**Core exports:**
```javascript
import { t, setLocale, getLocale, detectLocale } from './src/i18n/index.js';

// Translate with interpolation
const message = t('error.directoryExists', { path: './sketch' });

// Change locale
setLocale('fr');

// Auto-detect from environment
const locale = detectLocale(); // Checks LC_ALL, LC_MESSAGES, LANG
```

**How it works:**
1. Loads all JSON files from `locales/{locale}/`
2. Merges into single message map
3. Provides `t(key, vars)` function with simple interpolation
4. Replaces `{key}` with `vars.key`

### UI Primitives (src/ui/)

**Display Primitives (`src/ui/display.js`):**
```javascript
import * as display from './src/ui/display.js';

// All functions take translation keys
display.intro();                                    // Shows branded intro
display.info('info.creatingIn', { path: './sketch' });
display.success('note.success.created');
display.error('error.fetchVersions.failed');
display.warn('info.skipTypes');

// Spinners with i18n
const s = display.spinner('spinner.fetchingVersions');
s.stop('spinner.fetchedVersions');

// Notes (multi-line boxes)
display.note(['note.nextSteps.step1', 'note.nextSteps.step2'],
  'note.nextSteps.title',
  { projectName: 'my-sketch' });
```

**Prompt Primitives (`src/ui/prompts.js`):**
```javascript
import * as prompts from './src/ui/prompts.js';

// All prompts use translation keys internally
const template = await prompts.promptTemplate();
const version = await prompts.promptVersion(versions, latest);
const mode = await prompts.promptMode();
const action = await prompts.promptUpdateAction();
const shouldDelete = await prompts.confirmDeleteLib();

// Check for cancellation
if (prompts.isCancel(response)) {
  display.cancel('prompt.cancel.sketchCreation');
}
```

### Operations Layer (src/operations/)

**Business logic uses UI primitives:**
```javascript
// src/operations/scaffold.js
import * as display from '../ui/display.js';
import * as prompts from '../ui/prompts.js';
import { t } from '../i18n/index.js';

export async function scaffold(args) {
  display.intro();

  // Use prompts
  const template = await prompts.promptTemplate();

  // Use display for messages
  display.info('info.creatingIn', { path: projectPath });

  // Use t() for dynamic strings
  throw new Error(t('error.fetchTemplate', { template, error: err.message }));
}
```

### Adding New Messages

**1. Add to appropriate JSON file:**
```json
// locales/en/errors.json
{
  "error.myNewError": "Something went wrong: {details}"
}
```

**2. Use in code:**
```javascript
display.error('error.myNewError', { details: 'file not found' });
```

### Adding New Locales (Future)

To add French support:
```bash
cp -r locales/en locales/fr
# Edit all JSON files in locales/fr/
```

Users can set locale:
```javascript
setLocale('fr');
```

Or via environment:
```bash
LANG=fr_FR.UTF-8 npm create p5@latest
```

### Philosophy

**Zero Copy in Source Code:**
- NO hardcoded strings in `.js` files
- ALL user-facing text in JSON files
- Colors/formatting applied in display layer
- Content always from translations

**Separation of Concerns:**
- **locales/**: What to say (data)
- **src/i18n/**: How to load it (infrastructure)
- **src/ui/**: How to display it (presentation)
- **src/operations/**: What to do (logic)

**Benefits:**
- ✅ Complete i18n readiness
- ✅ Easy to add languages
- ✅ Consistent messaging
- ✅ Testable without UI
- ✅ Clear separation of concerns

## Important Architectural Principles

1. **Code against APIs, not implementations** - Expose stable contracts and keep internal details hidden
2. **Mock dependencies early** - Keep components decoupled
3. **Make it work → make it right → make it fast** - Don't optimize prematurely
4. **Modularity and DRY** - But only after features work (Stage 6+)
5. **Automated tests** - For all new features and bug fixes
6. **No feature creep during refactoring** - One thing at a time

## Red Flags to Avoid

- "While I'm here..." syndrome → Save it for later
- Commits touching 10+ files → Break it down
- Refactoring before features work → Too early, focus on correctness first
- Skipping tests "temporarily" → Technical debt accumulates
- No demo after 5 commits → Increments too small or code is broken
