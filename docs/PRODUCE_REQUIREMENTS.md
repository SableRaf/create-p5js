# Product Requirements Document: create-p5

## Overview

**Product Name:** create-p5  
**Version:** 1.0.0  
**Type:** npm create package  
**Target Audience:** Creative coders, educators, students, artists using p5.js  
**Repository:** https://github.com/[username]/create-p5  

## Executive Summary

`create-p5` is a scaffolding tool that enables users to quickly create and manage p5.js projects using the `npm create` convention. It provides both interactive and non-interactive modes for project creation, along with utilities to update existing projects safely.

## Goals

### Primary Goals
1. Make p5.js project creation as simple as `npm create p5@latest`
2. Provide a beginner-friendly interactive experience
3. Support multiple project templates (basic, instance mode, TypeScript)
4. Enable safe updates to existing projects (version, delivery mode)
5. Support community templates via GitHub

### Secondary Goals
1. Zero-configuration defaults that work out of the box
2. TypeScript IntelliSense support for better DX
3. Minimal package size for fast downloads
4. Clear, helpful error messages and documentation

## User Personas

### Persona 1: Beginning Creative Coder (Sarah)
- **Background:** Learning to code through creative projects
- **Needs:** Simple setup, clear defaults, helpful prompts
- **Pain Points:** Overwhelmed by configuration options
- **Usage:** `npm create p5@latest` → follows interactive prompts

### Persona 2: Experienced Developer (Alex)
- **Background:** Professional developer exploring creative coding
- **Needs:** Quick setup, TypeScript support, version control
- **Pain Points:** Slow scaffolding tools, missing type definitions
- **Usage:** `npm create p5@latest my-sketch -- --template typescript --yes`

### Persona 3: Educator (Jordan)
- **Background:** Teaching creative coding workshops
- **Needs:** Consistent setup for students, easy updates
- **Pain Points:** Students have different versions, hard to troubleshoot
- **Usage:** Provides students with exact command, uses update tools to fix issues

## Features

### 1. Project Scaffolding (MVP)

#### 1.1 Interactive Mode
**Priority:** P0 (Must Have)

**User Story:** As a beginner, I want to create a p5.js project by answering simple questions so I don't need to remember command flags.

**Acceptance Criteria:**
- Running `npm create p5@latest` starts interactive prompts
- Prompts ask for: project name, p5.js version, template, delivery mode, git init
- Smart defaults are pre-selected
- Progress indicators show scaffolding status
- Success message shows next steps

**Implementation:**
```bash
npm create p5@latest
```

**Prompts:**
1. Project name (validates directory doesn't exist)
2. p5.js version (shows latest 15 versions, defaults to latest)
3. Template selection (basic/instance/typescript/empty)
4. Delivery mode (cdn/local, defaults to cdn)
5. Initialize git? (yes/no, defaults to yes)

#### 1.2 Non-Interactive Mode
**Priority:** P0 (Must Have)

**User Story:** As an experienced developer, I want to scaffold projects with a single command so I can automate or quickly create projects.

**Acceptance Criteria:**
- All options can be passed via CLI flags
- `--yes` flag uses all defaults
- Invalid options show clear error messages
- Works in CI/CD environments

**Implementation:**
```bash
npm create p5@latest my-sketch -- --template basic --version 1.9.0 --mode cdn --yes
```

**Flags:**
- `-t, --template <name>` - Template choice
- `-v, --version <version>` - p5.js version
- `-m, --mode <cdn|local>` - Delivery mode
- `--no-git` - Skip git initialization
- `--no-types` - Skip TypeScript definitions
- `-y, --yes` - Use all defaults

#### 1.3 Current Directory Scaffolding
**Priority:** P1 (Should Have)

**User Story:** As a user, I want to scaffold in the current directory so I can control folder structure myself.

**Acceptance Criteria:**
- `.` as project name scaffolds in current directory
- Checks if directory is empty (warns if not)
- Requires confirmation if files exist

**Implementation:**
```bash
mkdir my-project && cd my-project
npm create p5@latest .
```

### 2. Templates (MVP)

#### 2.1 Basic Template
**Priority:** P0 (Must Have)

**Description:** Standard p5.js setup with global mode

**Files:**
- `index.html` - Entry point with p5.js script tag
- `sketch.js` - Simple setup/draw functions
- `style.css` - Basic styling
- `jsconfig.json` - IntelliSense configuration
- `p5-config.json` - Project metadata

**Script Tag Placeholder:**
```html
<!-- INJECT_P5_SCRIPT -->
```
Replaced with CDN or local path during scaffolding.

#### 2.2 Instance Mode Template
**Priority:** P1 (Should Have)

**Description:** Instance mode for multiple sketches

**Additional Features:**
- Creates p5 instance in sketch.js
- Example of multiple canvas setup

#### 2.3 TypeScript Template
**Priority:** P1 (Should Have)

**Description:** Full TypeScript setup

**Additional Files:**
- `sketch.ts` instead of sketch.js
- `tsconfig.json` - TypeScript configuration
- Type definitions pre-downloaded

#### 2.4 Empty Template
**Priority:** P2 (Nice to Have)

**Description:** Minimal HTML only, no sketch file

**Use Case:** Users who want complete control

### 3. Version Management (MVP)

#### 3.1 Version Fetching
**Priority:** P0 (Must Have)

**User Story:** As a user, I want to choose from recent p5.js versions so I can use a specific version or the latest.

**Acceptance Criteria:**
- Fetches latest 15 versions from jsdelivr API
- Shows versions in descending order (newest first)
- Indicates which is "latest"
- Handles network failures gracefully
- Caches results for 24 hours (optional)

**API Endpoint:**
```
https://data.jsdelivr.com/v1/packages/npm/p5
```

#### 3.2 Version Specification
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- Supports `latest` keyword (resolves to newest)
- Supports specific versions: `1.9.0`, `1.8.0`
- Validates version exists before scaffolding
- Clear error if version not found

### 4. Delivery Modes (MVP)

#### 4.1 CDN Mode
**Priority:** P0 (Must Have)

**Description:** Links to jsdelivr CDN (default, recommended for beginners)

**Acceptance Criteria:**
- Injects CDN script tag: `<script src="https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js"></script>`
- No local files downloaded
- Marked as default in prompts
- Works offline after first page load (browser cache)

#### 4.2 Local Mode
**Priority:** P1 (Should Have)

**Description:** Downloads p5.js to project

**Acceptance Criteria:**
- Downloads p5.js to `lib/p5.js`
- Downloads p5.min.js to `lib/p5.min.js`
- Injects local script tag: `<script src="lib/p5.js"></script>`
- Creates .gitignore for lib/ (optional)

### 5. TypeScript Definitions (MVP)

#### 5.1 Auto-Download
**Priority:** P1 (Should Have)

**User Story:** As a developer, I want TypeScript IntelliSense for p5.js so I get autocomplete and documentation.

**Acceptance Criteria:**
- Downloads matching @types/p5 version
- Saves to `types/p5.js@{version}.d.ts`
- Updates jsconfig.json to include types
- Works even for JavaScript projects (provides IntelliSense in VSCode)

**API Endpoint:**
```
https://cdn.jsdelivr.net/npm/@types/p5@{version}/index.d.ts
```

#### 5.2 Version Matching
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
- Attempts to match p5.js version to @types/p5 version
- Falls back to closest version if exact match unavailable
- Stores matched version in p5-config.json

### 6. Project Configuration (MVP)

#### 6.1 p5-config.json
**Priority:** P0 (Must Have)

**Description:** Metadata file for project management

**Schema:**
```json
{
  "version": "1.9.0",
  "mode": "cdn",
  "template": "basic",
  "typeDefsVersion": "1.7.7",
  "createdAt": "2025-11-28T10:30:00Z",
  "lastUpdated": "2025-11-28T10:30:00Z"
}
```

**Usage:**
- Created during scaffolding
- Read by update commands
- Not required for project to function (only for tooling)

### 7. Community Templates (Post-MVP)

#### 7.1 GitHub Template Support
**Priority:** P2 (Nice to Have)

**User Story:** As a community member, I want to share my p5.js starter templates so others can benefit from my setup.

**Acceptance Criteria:**
- Supports format: `--template user/repo`
- Uses degit to clone repository
- Supports subdirectories: `--template user/repo/subdirectory`
- Supports branches: `--template user/repo#branch`
- Shows clear error if repo doesn't exist or is private

**Implementation:**
```bash
npm create p5@latest -- --template SableRaf/p5-template
npm create p5@latest -- --template processing/p5.js-website/src/templates/example
```

### 8. Update Existing Projects (MVP)

#### 8.1 Auto-Detection
**Priority:** P0 (Must Have)

**User Story:** As a user running create-p5 in an existing project, I want helpful options for updating so I don't accidentally break things.

**Acceptance Criteria:**
- Detects p5-config.json in current directory
- Shows different menu/options for existing projects
- Clear messaging about what will be updated

#### 8.2 Version Update
**Priority:** P0 (Must Have)

**User Story:** As a user, I want to update my p5.js version safely so I can get new features or bug fixes.

**Acceptance Criteria:**
- Updates script tag (CDN mode) or downloads new file (local mode)
- Updates p5-config.json
- Updates TypeScript definitions if present
- Shows diff of what changed
- Backs up index.html before modification (optional)

**Commands:**
```bash
npx create-p5 update
npx create-p5 update --version 1.10.0
```

#### 8.3 Mode Switching
**Priority:** P1 (Should Have)

**User Story:** As a user, I want to switch between CDN and local mode so I can work offline or reduce dependencies.

**Acceptance Criteria:**
- **CDN → Local:** Downloads p5.js, updates script tag, asks to delete lib/ folder
- **Local → CDN:** Updates script tag to CDN, confirms deletion of lib/ folder
- Updates p5-config.json
- Validates changes by checking file existence

**Commands:**
```bash
npx create-p5 mode local
npx create-p5 mode cdn
```

#### 8.4 Project Info
**Priority:** P2 (Nice to Have)

**User Story:** As a user, I want to see my current project configuration so I know what version I'm using.

**Acceptance Criteria:**
- Reads p5-config.json
- Shows current version, mode, template, TypeScript status
- Shows creation and last update dates

**Command:**
```bash
npx create-p5 info
```

**Output:**
```
p5.js Project Info:
  Version: 1.9.0
  Mode: CDN
  Template: basic
  TypeScript Definitions: Yes (v1.7.7)
  Created: 2024-11-15
  Last Updated: 2024-11-20
```

#### 8.5 List Versions
**Priority:** P2 (Nice to Have)

**User Story:** As a user, I want to see available p5.js versions so I can choose which to update to.

**Command:**
```bash
npx create-p5 versions
```

**Output:**
```
Available p5.js versions:
  1.10.0 (latest)
  1.9.4
  1.9.3
  1.9.0
  1.8.0
  ...
```

### 9. Git Integration (MVP)

#### 9.1 Git Initialization
**Priority:** P1 (Should Have)

**User Story:** As a developer, I want my project initialized with git so I can track changes immediately.

**Acceptance Criteria:**
- Runs `git init` after scaffolding
- Creates basic .gitignore with node_modules, .DS_Store
- Optional (user can decline via prompt or `--no-git`)
- Only runs if git is installed (silent skip if not)

#### 9.2 .gitignore Template
**Priority:** P1 (Should Have)

**Contents:**
```
node_modules/
.DS_Store
*.log
.env
```

For local mode, also adds:
```
lib/
```

### 10. Developer Experience

#### 10.1 Help Documentation
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- `--help` flag shows comprehensive help
- Command-specific help: `npx create-p5 update --help`
- Examples for common use cases
- Clear descriptions of all flags

#### 10.2 Error Handling
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- Network failures show helpful message with retry option
- Invalid directories show clear error
- Version not found suggests similar versions
- All errors are user-friendly (no stack traces unless --verbose)

#### 10.3 Progress Indicators
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
- Spinners for network operations (fetching versions, downloading files)
- Progress bars for large downloads
- Success/error symbols (✓/✗)
- Color-coded messages (success=green, error=red, info=blue)

**Libraries:**
- `@clack/prompts` - Interactive prompts with spinners
- `kolorist` - Terminal colors

### 11. Performance

#### 11.1 Package Size
**Priority:** P1 (Should Have)

**Target:** < 1MB installed size

**Strategy:**
- Minimal dependencies
- Tree-shakeable code
- Don't bundle templates (include as files)

#### 11.2 Execution Speed
**Priority:** P1 (Should Have)

**Targets:**
- Scaffolding (no download): < 3 seconds
- Scaffolding (local mode): < 10 seconds
- Update operations: < 2 seconds

### 12. Compatibility

#### 12.1 Node.js Versions
**Priority:** P0 (Must Have)

**Support:** Node.js 18.0.0+

**Rationale:**
- Native fetch API (no axios dependency)
- Modern ESM support
- Active LTS versions

#### 12.2 Package Managers
**Priority:** P0 (Must Have)

**Support:**
- npm 7+
- yarn 1.22+
- pnpm 8+
- bun 1.0+

**Test Matrix:**
```bash
npm create p5@latest
yarn create p5
pnpm create p5
bun create p5
```

#### 12.3 Operating Systems
**Priority:** P0 (Must Have)

**Support:**
- macOS (Intel & Apple Silicon)
- Windows 10/11
- Linux (Ubuntu, Debian, Fedora)

### 13. Documentation

#### 13.1 README.md
**Priority:** P0 (Must Have)

**Sections:**
- Quick start (3 commands)
- Interactive mode walkthrough
- Command reference
- Template descriptions
- Update workflow
- Community templates
- FAQ
- Contributing guide

#### 13.2 Examples
**Priority:** P1 (Should Have)

**Include:**
- Basic usage
- TypeScript project
- Community template usage
- Update scenarios
- CI/CD usage

### 14. Testing

#### 14.1 Unit Tests
**Priority:** P1 (Should Have)

**Coverage:**
- Version fetching and parsing
- Template file operations
- Config file reading/writing
- Argument parsing

**Framework:** Vitest or Node's native test runner

#### 14.2 Integration Tests
**Priority:** P1 (Should Have)

**Scenarios:**
- Full scaffolding workflow
- Update in existing project
- Mode switching
- Error cases (network failure, invalid inputs)

#### 14.3 Manual Testing Checklist
**Priority:** P0 (Must Have)

**Before Each Release:**
- [ ] Interactive mode creates project successfully
- [ ] Non-interactive mode with flags works
- [ ] Update commands work in existing project
- [ ] Templates render correctly
- [ ] Help documentation is accurate
- [ ] Works on macOS, Windows, Linux

## Technical Architecture

### Project Structure
```
create-p5/
├── index.js                 # Entry point (#!/usr/bin/env node)
├── package.json
├── README.md
├── LICENSE
├── .gitignore
├── src/
│   ├── cli.js              # Main CLI logic
│   ├── scaffold.js         # New project creation
│   ├── update.js           # Update existing projects
│   ├── prompts.js          # Interactive prompts
│   ├── config.js           # p5-config.json management
│   ├── version.js          # Version fetching from jsdelivr
│   ├── template.js         # Template operations
│   ├── git.js              # Git operations
│   └── utils.js            # Utilities (logging, validation, etc.)
├── templates/
│   ├── basic/
│   │   ├── index.html
│   │   ├── sketch.js
│   │   ├── style.css
│   │   └── jsconfig.json
│   ├── instance/
│   │   ├── index.html
│   │   ├── sketch.js
│   │   ├── style.css
│   │   └── jsconfig.json
│   ├── typescript/
│   │   ├── index.html
│   │   ├── sketch.ts
│   │   ├── style.css
│   │   ├── jsconfig.json
│   │   └── tsconfig.json
│   └── empty/
│       ├── index.html
│       └── style.css
└── tests/
    ├── scaffold.test.js
    ├── update.test.js
    └── version.test.js
```

### Dependencies

**Production:**
- `@clack/prompts` (^0.7.0) - Interactive prompts
- `kolorist` (^1.8.0) - Terminal colors
- `minimist` (^1.2.8) - Argument parsing
- `degit` (^2.8.4) - GitHub template cloning

**Development:**
- `vitest` - Testing framework
- `prettier` - Code formatting
- `eslint` - Linting

### Key Modules

#### cli.js
```javascript
// Entry point routing
export async function init() {
  const argv = process.argv.slice(2)
  
  // Check if in existing project
  const hasConfig = fs.existsSync('p5-config.json')
  
  if (hasConfig && !argv[0]) {
    // Update workflow
    await update()
  } else {
    // Scaffold workflow
    await scaffold(argv)
  }
}
```

#### scaffold.js
```javascript
export async function scaffold(argv) {
  // 1. Parse arguments
  // 2. Run prompts (if interactive)
  // 3. Validate inputs
  // 4. Copy template
  // 5. Inject p5.js script
  // 6. Download TypeScript definitions
  // 7. Create p5-config.json
  // 8. Git init (optional)
  // 9. Show success message
}
```

#### update.js
```javascript
export async function update() {
  // 1. Read p5-config.json
  // 2. Show current state
  // 3. Prompt for what to update
  // 4. Perform update
  // 5. Update p5-config.json
  // 6. Show success message
}
```

#### version.js
```javascript
export async function fetchVersions() {
  // Fetch from jsdelivr API
  // Parse and return latest 15 versions
  // Cache results (optional)
}

export async function downloadP5(version, dest) {
  // Download p5.js and p5.min.js
  // Save to dest directory
}

export async function downloadTypes(version, dest) {
  // Download @types/p5
  // Save to dest directory
}
```

## Success Metrics

### Adoption Metrics
- npm weekly downloads > 1,000 (6 months post-launch)
- GitHub stars > 100 (3 months post-launch)
- Community templates created > 10 (6 months post-launch)

### Quality Metrics
- < 5 critical bugs reported (first month)
- Test coverage > 80%
- Package size < 1MB
- Average scaffolding time < 5 seconds

### User Satisfaction
- Positive feedback in GitHub issues
- Integration into p5.js official documentation (aspirational)
- Adoption by educators for teaching

## Release Plan

### Phase 1: MVP (v1.0.0)
**Timeline:** 2-3 weeks

**Features:**
- Interactive and non-interactive scaffolding
- Basic, instance, TypeScript, empty templates
- CDN and local modes
- Version management
- TypeScript definitions
- Update commands (version, mode)
- Git integration

**Success Criteria:**
- All P0 features complete
- Works on macOS, Windows, Linux
- Documentation complete
- Manual testing passed

### Phase 2: Community Features (v1.1.0)
**Timeline:** 1-2 months after v1.0.0

**Features:**
- Community template support (degit)
- Template discovery/listing
- Version caching
- Enhanced error messages
- More robust update detection

### Phase 3: Advanced Features (v1.2.0+)
**Timeline:** Ongoing

**Potential Features:**
- Plugin system
- Custom template URLs
- Project migration tools
- Interactive tutorial mode
- IDE integrations

## Risks & Mitigations

### Risk 1: jsdelivr API Changes
**Impact:** High  
**Probability:** Low  
**Mitigation:** 
- Monitor jsdelivr changelog
- Implement fallback to npm registry API
- Cache version data

### Risk 2: Breaking Changes in p5.js
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Pin to specific p5.js versions in templates
- Test against beta versions
- Provide migration guides

### Risk 3: Community Template Quality
**Impact:** Medium  
**Probability:** High  
**Mitigation:**
- No official endorsement of community templates
- Clear documentation on template validation
- Consider curated list (post-MVP)

### Risk 4: Name Availability on npm
**Impact:** High  
**Probability:** Low  
**Mitigation:**
- Check availability before announcement
- Have backup names: `create-p5js`, `p5-create`, `scaffold-p5`

## Open Questions

1. **Should we support p5.sound separately?**
   - Option 1: Always include in templates
   - Option 2: Prompt for add-ons during scaffolding
   - Option 3: Post-MVP feature

2. **How to handle p5.js pre-release versions?**
   - Show in version list?
   - Separate `--pre` flag?
   - Only show if explicitly requested?

3. **Should we create a starter package.json with scripts?**
   - Pros: Enables `npm run dev` with live server
   - Cons: Adds complexity, requires dependencies
   - Decision: Post-MVP, optional flag

4. **TypeScript definitions version mismatch handling?**
   - Current: Best-effort matching
   - Alternative: Warn if no exact match
   - Alternative: Don't download if mismatch

## Appendix

### A. Command Reference

```bash
# Scaffolding
npm create p5@latest
npm create p5@latest <name>
npm create p5@latest <name> -- [options]

# Options
-t, --template <name>     # basic, instance, typescript, empty, user/repo
-v, --version <version>   # latest, 1.9.0, etc.
-m, --mode <mode>         # cdn, local
--no-git                  # Skip git init
--no-types                # Skip TypeScript definitions
-y, --yes                 # Use all defaults

# Updates (inside project)
npx create-p5 update [--version <version>]
npx create-p5 mode <cdn|local>
npx create-p5 info
npx create-p5 versions

# Help
npx create-p5 --help
npx create-p5 <command> --help
```

### B. Template Specifications

#### Basic Template File Contents

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>p5.js Sketch</title>
  <link rel="stylesheet" href="style.css">
  <!-- INJECT_P5_SCRIPT -->
</head>
<body>
  <script src="sketch.js"></script>
</body>
</html>
```

**sketch.js:**
```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  circle(mouseX, mouseY, 50);
}
```

**style.css:**
```css
html, body {
  margin: 0;
  padding: 0;
}

canvas {
  display: block;
}
```

**jsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES6"
  },
  "include": [
    "*.js",
    "types/*.d.ts"
  ]
}
```

### C. API Endpoints

**jsdelivr p5.js versions:**
```
GET https://data.jsdelivr.com/v1/packages/npm/p5
```

**Response:**
```json
{
  "versions": [
    {"version": "1.10.0"},
    {"version": "1.9.4"},
    ...
  ]
}
```

**jsdelivr CDN p5.js:**
```
https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js
https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.min.js
```

**jsdelivr TypeScript definitions:**
```
https://cdn.jsdelivr.net/npm/@types/p5@{version}/index.d.ts
```

### D. Version History

- **v1.0.0** - Initial release (MVP)
- **v1.1.0** - Community templates
- **v1.2.0** - TBD

### Stretch Goals (Post-MVP)

- Support for loading templates from the OpenProcessing API with a sketch ID or URL (requires API access and licensing checks)
- Support for p5 1.x and p5 2.x side by side
- Support for additional p5.js libraries (p5.sound) in p5 1.x projects (they are built-in in p5 2.x)
- Support for searching examples from the p5.js website and using them as templates (will need crediting and licensing checks + central registry)

---

**Document Version:** 1.0  
**Last Updated:** November 28, 2025  
**Author:** Product Team  
**Status:** Draft → Ready for Development