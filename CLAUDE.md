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

├── index.js                 # Entry point (#!/usr/bin/env node)
├── package.json
├── docs/
│   ├── DOCUMENTATION_GUIDELINES.md   # Coding standards and documentation practices
│   ├── PRODUCT_REQUIREMENTS.md       # High-level product requirements and features
│   └── WORKFLOW_GUIDELINES.md        # Development workflow and best practices
│   └── IMPLEMENTATION_PLAN.md        # Implementation plan and steps (generated from WORKFLOW_GUIDELINES)
├── src/
│   ├── cli.js              # Main CLI logic and routing
│   ├── scaffold.js         # New project creation
│   ├── update.js           # Update existing projects
│   ├── prompts.js          # Interactive prompts
│   ├── config.js           # p5-config.json management
│   ├── version.js          # Version fetching from jsdelivr
│   ├── template.js         # Template operations
│   ├── git.js              # Git operations
│   └── utils.js            # Utilities (logging, validation, etc.)
├── templates/
│   ├── basic/              # Standard p5.js with global mode
│   ├── instance/           # Instance mode for multiple sketches
│   ├── typescript/         # TypeScript setup with type definitions
│   └── empty/              # Minimal HTML only
└── tests/
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
- Supports version matching for TypeScript definitions from `@types/p5` using same API
- Downloads p5.js files from jsdelivr CDN when using local mode

## Development Workflow

### Philosophy
Follow incremental development in 6-10 stages with 2-4 atomic commits per stage:
1. **Proof of Concept** - Hardcoded, single feature, validates approach
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
  "typeDefsVersion": "1.7.7",
  "lastUpdated": "2025-11-28T10:30:00Z"
}
```

**Fields:**
- `version` - The p5.js version currently in use
- `mode` - Delivery mode: "cdn" or "local"
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

**Fetching TypeScript Definitions:**
```javascript
// Get all versions for @types/p5 from https://cdn.jsdelivr.net/npm/p5@{version}/types/global.d.ts
const response = await fetch(`${cdnUrl}/p5@${version}/types/global.d.ts`);
const data = await response.json();
const typeVersions = data.versions;
```

**Methods:**
- `getVersions()` - Returns all available p5.js versions
- `getLatest()` - Returns the latest stable version
- `getVersionsForPackage(packageName)` - Generic method for any npm package
- `getLatestForPackage(packageName)` - Gets latest version for any package

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

### Proof of Concept Validation Status

The proof_of_concept modules have validated:
✅ HTML manipulation using linkedom (not regex)
✅ Multi-CDN detection and URL building
✅ jsdelivr API interaction (correct endpoints and response structure)
✅ Configuration file persistence
✅ File I/O abstraction layer
✅ User prompt interactions with @clack/prompts
✅ Dependency injection pattern
✅ Single responsibility principle

**These implementations should be used as references** when building the production `src/` modules. The architectural patterns, API usage, and error handling strategies have been proven to work.

### Download URLs for Local Mode

When downloading p5.js files for local mode, use the jsdelivr CDN:

**p5.js library files:**
```
https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js
https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.min.js
```

**TypeScript type definitions:**
```
https://cdn.jsdelivr.net/npm/p5@{version}/types/global.d.ts
```

Note: TypeScript types may not exist for all p5.js versions. The tool should:
1. Try to download types for the exact p5.js version
2. Fall back to the latest available @types/p5 version if exact match not found
3. Store the actual downloaded version in `typeDefsVersion` config field

### Usage Patterns
```bash
# Interactive mode
npm create p5@latest

# Non-interactive with flags
npm create p5@latest my-sketch -- --template typescript --mode cdn --yes

# Update existing project
npx create-p5 update --version 1.10.0

# Switch delivery mode
npx create-p5 mode local
```

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
