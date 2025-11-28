# Implementation Plan: create-p5

**Version:** 1.0
**Target Release:** v1.0.0 MVP
**Total Estimated Time:** 28-38 hours
**Development Stages:** 8

## Overview

This implementation plan follows incremental development principles to build `create-p5`, an npm scaffolding tool for p5.js projects. Each stage builds on the previous, with 2-4 atomic commits and clear demo-able checkpoints.

**Development Philosophy:**
- Make it work → make it right → make it fast
- Atomic commits with single purposes
- Test after each commit (post-PoC)
- No feature additions during refactoring
- Renaming/moving files requires separate commits

---

## Stage 1: Proof of Concept - Basic Scaffolding
**Goal:** Hardcoded project creation validates core approach
**Time:** 3-4 hours, 4 commits

### Commit 1: Project initialization
**What:** Set up npm package structure with entry point
- Create `package.json` with bin entry pointing to `index.js`
- Create `index.js` with shebang (`#!/usr/bin/env node`)
- Add basic dependencies: `@clack/prompts`, `kolorist`, `minimist`
- Configure package as ESM (`"type": "module"`)

### Commit 2: Create basic template files
**What:** Add hardcoded template with p5.js setup
- Create `templates/basic/index.html` with hardcoded p5.js v1.9.0 CDN link
- Create `templates/basic/sketch.js` with simple setup/draw
- Create `templates/basic/style.css` with basic styling
- Create `templates/basic/jsconfig.json` for IntelliSense

### Commit 3: Implement basic file copying
**What:** Copy template to target directory
- Create `src/utils.js` with file copy function
- Hardcode project name as "my-sketch"
- Copy all template files to `my-sketch/` directory
- Log success message to console

### Commit 4: Add initial CLI interface
**What:** Parse project name from command line
- Update `index.js` to accept project name argument
- Use `minimist` to parse `process.argv`
- Create directory with user-provided name (or default to "my-sketch")
- Show error if directory already exists

**Checkpoint:** Running `node index.js test-project` creates a working p5.js project with hardcoded v1.9.0. **Ship it.**

---

## Stage 2: Dynamic Version Selection
**Goal:** Fetch real p5.js versions from jsdelivr API
**Time:** 3-4 hours, 3 commits

### Commit 1: Create VersionProvider module
**What:** Fetch versions from jsdelivr API
- Create `src/version.js` with `fetchVersions()` function
- Use fetch API to GET `https://data.jsdelivr.com/v1/package/npm/p5`
- Parse response to extract version array and latest tag
- Return object with `{ latest, versions }` (limit to 15 most recent)

### Commit 2: Add interactive version selection
**What:** Prompt user to choose p5.js version
- Create `src/prompts.js` with `selectVersion()` function
- Use `@clack/prompts.select()` to show version choices
- Display versions in descending order with "latest" indicator
- Return selected version string

### Commit 3: Inject selected version into template
**What:** Update HTML with chosen p5.js version
- Create `src/template.js` with `injectP5Script()` function
- Use `linkedom` to parse HTML and manipulate DOM
- Replace `<!-- P5JS_SCRIPT_TAG -->` marker with actual script tag
- Build CDN URL: `https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js`

**Checkpoint:** Users can select any p5.js version and it's injected into the template. **Ship it.**

---

## Stage 3: Project Configuration Persistence
**Goal:** Save project metadata to p5-config.json
**Time:** 2-3 hours, 3 commits

### Commit 1: Create ConfigManager module
**What:** Handle p5-config.json read/write operations
- Create `src/config.js` with `ConfigManager` class
- Implement `create(options)` method to write new config
- Implement `read()` method to parse existing config
- Use proper JSON formatting with 2-space indent

### Commit 2: Save config during scaffolding
**What:** Create p5-config.json in new projects
- Update scaffold flow to create config file
- Save version, mode (hardcoded "cdn"), template name, timestamps
- Store config as `p5-config.json` in project root
- Log config creation in success message

### Commit 3: Detect existing projects
**What:** Check for existing p5-config.json
- Update `index.js` to check if `p5-config.json` exists in current directory
- Show different message if project already exists
- Prevent re-scaffolding (prepare for update workflow)
- Exit gracefully with helpful message

**Checkpoint:** New projects get p5-config.json; existing projects are detected. **Ship it.**

---

## Stage 4: Alternative Delivery Modes
**Goal:** Support both CDN and local p5.js files
**Time:** 4-5 hours, 4 commits

### Commit 1: Add mode selection prompt
**What:** Let users choose CDN or local delivery
- Add `selectMode()` function to `src/prompts.js`
- Use `@clack/prompts.select()` with CDN (default) and local options
- Add helpful descriptions for each mode
- Return selected mode string

### Commit 2: Implement local file download
**What:** Download p5.js files for local mode
- Add `downloadP5Files(version, targetDir)` to `src/version.js`
- Download both `p5.js` and `p5.min.js` from jsdelivr CDN
- Save to `lib/` directory in project
- Use fetch with streaming for large files

### Commit 3: Update HTML manipulation for modes
**What:** Inject correct script path based on mode
- Update `injectP5Script()` in `src/template.js` to accept mode parameter
- CDN mode: Use `https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js`
- Local mode: Use `./lib/p5.js`
- Update config to store selected mode

### Commit 4: Create lib directory for local mode
**What:** Ensure lib/ directory exists before download
- Add directory creation logic before downloading files
- Only create lib/ if local mode selected
- Update .gitignore template to exclude lib/ in local mode
- Verify files downloaded successfully

**Checkpoint:** Users can choose CDN or local mode; local mode downloads files correctly. **Ship it.**

---

## Stage 5: Multiple Templates and TypeScript Support
**Goal:** Support basic, instance, typescript, and empty templates
**Time:** 5-6 hours, 4 commits

### Commit 1: Create additional template directories
**What:** Add instance, typescript, and empty templates
- Create `templates/instance/` with instance mode example
- Create `templates/typescript/` with .ts files and tsconfig.json
- Create `templates/empty/` with minimal HTML only
- Ensure each has proper jsconfig.json

### Commit 2: Add template selection prompt
**What:** Let users choose template type
- Add `selectTemplate()` to `src/prompts.js`
- Show template choices with descriptions
- Default to "basic" template
- Return selected template name

### Commit 3: Implement TypeScript definitions download
**What:** Download type definitions for IntelliSense
- Add `downloadTypeDefinitions(version, targetDir)` to `src/version.js`
- Download from `https://cdn.jsdelivr.net/npm/p5@{version}/types/global.d.ts`
- Save to `types/` directory
- Handle cases where types don't exist (fallback to latest)

### Commit 4: Integrate template selection into scaffold flow
**What:** Copy correct template based on user choice
- Update scaffold logic to use selected template
- Download types for all templates (including JS templates for IntelliSense)
- Store template name in p5-config.json
- Update success message to show template used

**Checkpoint:** Users can select from 4 templates; TypeScript definitions download automatically. **Ship it.**

---

## Stage 6: Update Existing Projects
**Goal:** Support version updates and mode switching
**Time:** 5-6 hours, 4 commits

### Commit 1: Create update command routing
**What:** Detect and handle update workflow
- Create `src/update.js` with main `update()` function
- Detect existing project by reading p5-config.json
- Route to update workflow when detected
- Show current project state (version, mode, template)

### Commit 2: Implement version update
**What:** Update p5.js version in existing projects
- Add `updateVersion(newVersion)` function to `src/update.js`
- CDN mode: Update script tag in index.html
- Local mode: Re-download p5.js files
- Update p5-config.json with new version and timestamp

### Commit 3: Implement mode switching
**What:** Switch between CDN and local delivery
- Add `switchMode(newMode)` function to `src/update.js`
- CDN → Local: Download files, update script tag
- Local → CDN: Update script tag, prompt to delete lib/
- Update p5-config.json mode field

### Commit 4: Add HTML script tag updating
**What:** Reliably detect and update existing p5.js script tags
- Add `updateP5Script(htmlPath, version, mode)` to `src/template.js`
- Detect existing p5.js script from any CDN (jsdelivr, cdnjs, unpkg)
- Preserve user preferences (minification, CDN choice)
- Use three-tier strategy: update existing → replace marker → insert in head

**Checkpoint:** Users can update version and switch modes in existing projects. **Ship it.**

---

## Stage 7: Non-Interactive Mode and Git Integration
**Goal:** Support CLI flags and optional git initialization
**Time:** 3-4 hours, 3 commits

### Commit 1: Add argument parsing for all options
**What:** Support full non-interactive mode with flags
- Update CLI to parse flags: `--template`, `--version`, `--mode`, `--git`, `--yes`, `--no-types`
- Use `minimist` for flag parsing
- Add `--help` flag with usage documentation
- Skip prompts when all required options provided

### Commit 2: Implement git initialization
**What:** Optionally run git init after scaffolding
- Create `src/git.js` with `initGit(projectDir)` function
- Run `git init` using child_process.spawn
- Create .gitignore with node_modules, .DS_Store, *.log, .env
- Add lib/ to .gitignore for local mode
- Only run if git is installed (detect via `git --version`)

### Commit 3: Add --yes flag for defaults
**What:** Enable fully automated scaffolding
- Implement `--yes` flag to skip all prompts
- Use defaults: latest version, basic template, cdn mode, no git
- Combine with other flags for custom automation
- Show summary of choices before proceeding (unless --yes)

**Checkpoint:** Tool supports both interactive and non-interactive modes with git integration. **Ship it.**

---

## Stage 8: Error Handling and User Experience
**Goal:** Graceful error handling, validation, and polished UX
**Time:** 3-4 hours, 4 commits

### Commit 1: Add comprehensive input validation
**What:** Validate all user inputs with helpful errors
- Validate project name (no spaces, special chars)
- Check directory doesn't exist before creating
- Validate version exists before scaffolding
- Verify template selection is valid
- Show specific error messages with suggestions

### Commit 2: Handle network failures gracefully
**What:** Deal with API and download failures
- Wrap fetch calls in try/catch blocks
- Show helpful error if jsdelivr API unreachable
- Offer retry option for failed downloads
- Fallback to cached versions if available (optional)
- Never leave project in broken state

### Commit 3: Add progress indicators and spinners
**What:** Show visual feedback for long operations
- Use `@clack/prompts.spinner()` for API calls
- Show progress for file downloads
- Use `kolorist` for color-coded messages (green=success, red=error, blue=info)
- Add checkmarks (✓) and crosses (✗) for status

### Commit 4: Improve success messaging and next steps
**What:** Guide users on what to do after scaffolding
- Create formatted success message with project summary
- Show clear next steps: cd into directory, open index.html
- Include helpful tips based on selections (TypeScript setup, git commands)
- Add --verbose flag for detailed logging

**Checkpoint:** Tool handles errors gracefully and provides excellent user experience. **Ship it.**

---

## Stage 9: Refactoring and Code Quality
**Goal:** Clean, maintainable, DRY code
**Time:** 3-4 hours, 3 commits

### Commit 1: Extract common utilities
**What:** Consolidate repeated file operations
- Create comprehensive `src/utils.js` with file helpers
- Add `createDirectory()`, `copyFile()`, `fileExists()`, `readJSON()`, `writeJSON()`
- Replace all inline fs operations with utility functions
- No behavior changes, only extraction

### Commit 2: Simplify prompt flow
**What:** Create unified prompt orchestration
- Add `runInteractivePrompts()` to `src/prompts.js`
- Single function that runs all prompts in sequence
- Return structured options object
- Reduce duplication in CLI routing

### Commit 3: Abstract HTML manipulation
**What:** Create HTMLManager class for DOM operations
- Move all linkedom operations to `src/template.js`
- Create `HTMLManager` class with methods: `parse()`, `serialize()`, `findP5Script()`, `updateP5Script()`
- Implement multi-CDN detection patterns
- Ensure all tests still pass

**Checkpoint:** Code is modular, DRY, and maintainable with no behavior changes. **Ship it.**

---

## Stage 10: Documentation and Testing
**Goal:** Complete documentation and automated tests
**Time:** 4-5 hours, 3 commits

### Commit 1: Add comprehensive JSDoc comments
**What:** Document all public APIs
- Add JSDoc to all exported functions and classes
- Include parameter types, return types, and descriptions
- Add usage examples in comments for complex functions
- Document error cases and edge behaviors

### Commit 2: Create unit tests
**What:** Test core functionality in isolation
- Set up Vitest test framework
- Create `tests/version.test.js` for API interactions
- Create `tests/config.test.js` for configuration management
- Create `tests/template.test.js` for HTML manipulation
- Achieve >80% code coverage for core modules

### Commit 3: Write comprehensive README
**What:** Create user-facing documentation
- Add quick start section (3 commands to get started)
- Document interactive mode walkthrough
- Create command reference with all flags
- Add template descriptions and examples
- Include troubleshooting section and FAQ
- Add contributing guidelines

**Checkpoint:** Project is fully documented and tested. **Ship it.**

---

## Development Best Practices

### 1. Test After Each Commit
After every commit (post-Stage 1), test the functionality:
```bash
# Link package locally for testing
npm link

# Test scaffolding
npm create p5@latest test-project

# Test in interactive mode
cd test-project && open index.html

# Test update workflow
npx create-p5 update

# Unlink when done
npm unlink -g create-p5
```

### 2. Commit Message Format
Use conventional commit format with clear descriptions:
```bash
# Good examples
git commit -m "feat: add version fetching from jsdelivr API"
git commit -m "fix: handle network timeout during file download"
git commit -m "refactor: extract HTML manipulation to dedicated module"
git commit -m "docs: add JSDoc comments to ConfigManager class"
git commit -m "test: add unit tests for version provider"

# Include details
git commit -m "feat: add interactive version selection

- Fetch latest 15 versions from jsdelivr API
- Display with latest indicator
- Return selected version for scaffolding
- Handle API errors gracefully"
```

### 3. Keep Module Files Focused
Each module should have single responsibility:
```javascript
// src/version.js - Version API interactions only
export async function fetchVersions() { }
export async function downloadP5Files() { }
export async function downloadTypeDefinitions() { }

// src/prompts.js - User interaction only
export async function selectVersion() { }
export async function selectTemplate() { }
export async function selectMode() { }

// src/config.js - Configuration management only
export class ConfigManager {
  create() { }
  read() { }
  update() { }
}
```

### 4. One Thing Breaks? Stop and Fix
If a change breaks existing functionality:
1. STOP adding new features
2. Create a failing test that reproduces the bug
3. Fix the regression
4. Commit the fix separately
5. THEN continue with new features

### 5. Don't Add Features While Refactoring
Stage 9 is for refactoring ONLY:
- Extract functions
- Rename for clarity
- Remove duplication
- Improve structure
- **NO new features**
- **NO behavior changes**
- All tests must pass

### 6. Renaming and Moving Files
File renames/moves MUST be separate commits:
```bash
# WRONG: Rename + modify in one commit
git mv src/scaffold.js src/scaffolder.js
# + make changes to scaffolder.js
git commit -m "refactor: rename and improve scaffolder"

# RIGHT: Two separate commits
# Commit 1: Rename only
git mv src/scaffold.js src/scaffolder.js
git commit -m "refactor: rename scaffold.js to scaffolder.js"

# Commit 2: Modifications
# + make changes to scaffolder.js
git commit -m "refactor: simplify scaffolder implementation"
```

### 7. Document as You Go
Don't wait until Stage 10 for all documentation:
- Add JSDoc when writing functions (Stages 1-8)
- Update inline comments when changing logic
- Keep README in sync with features
- Document breaking changes immediately
- Stage 10 is for comprehensive review, not initial documentation

---

## Red Flags

🚩 **"While I'm here, let me add mode switching..."** → Stage boundaries exist for a reason
🚩 **Commit touches 8 files across 3 modules** → Break it down into atomic changes
🚩 **"Almost done" on day 2 of Stage 1** → Over-engineering; keep it simple
🚩 **No demo after 5 commits** → Increments too small or code is broken
🚩 **Refactoring in Stage 3** → Too early; features first, cleanup later
🚩 **Skipping tests "temporarily"** → Technical debt compounds quickly
🚩 **Renaming files without separate commit** → Makes review and history tracking difficult
🚩 **Adding TypeScript conversion during HTML refactor** → Multiple concerns in one change
🚩 **"Just quickly adding..."** → Requires a commit plan, even if small

---

## Iteration Workflows

### Triage Framework

```
Post-launch feedback received
├─ Bug?
│  ├─ Critical (breaks core scaffolding) → HOT FIX (immediate, 1 commit)
│  ├─ High (breaks update workflow) → MINI-PLAN (2-3 commits, same day)
│  └─ Non-critical (poor UX, minor issue) → MINI-PLAN (1-3 commits, scheduled)
└─ Feature/Enhancement?
   ├─ Small (<1 hour) → Single commit
   ├─ Medium (1-3 hours) → Mini-plan (2-4 commits)
   └─ Large (>3 hours) → Full stage plan
```

### Decision Matrix

| Type | Files | Time | Needs Plan? | Example |
|------|-------|------|-------------|---------|
| Typo/docs | 1 | 5 min | ❌ | Fix README spelling |
| Simple bug | 1-2 | <30 min | ❌ | Fix validation regex |
| Complex bug | 3+ | >1 hour | ✅ | Fix template injection across CDNs |
| Small enhancement | 1-2 | <1 hour | ⚠️ | Add --quiet flag |
| New feature | 3+ | >2 hours | ✅ | Add info command |
| Refactoring | 2+ | >1 hour | ✅ | Extract prompt utilities |

---

## Mini-Plan Templates

### Bug Fix Template

```markdown
## Bug Fix: [Specific error]

**Context:** Issue #X - [Problem description]
**Goal:** [Expected behavior]
**Time:** X hours, Y commits

### Commit 1: Add failing test
**What:** Reproduce the bug
- Create test case demonstrating issue
- Verify it fails with current code
- Document expected behavior

### Commit 2: Fix the issue
**What:** Implement solution
- [Specific fix in module X]
- [Update related logic in module Y]
- Verify test passes
- Check for regressions with existing tests

**Checkpoint:**
✅ Bug no longer occurs
✅ All tests pass
✅ No side effects
```

### Feature Addition Template

```markdown
## Feature: [New capability]

**Context:** [Why needed]
**Goal:** Users can [action]
**Time:** X hours, Y commits

### Commit 1: Basic implementation
**What:** Minimal working version
- Add core function to [module]
- Wire into CLI routing
- Hardcoded/simple version only

### Commit 2: Add user interface
**What:** Connect to prompts and flags
- Add prompt for interactive mode
- Add CLI flag for non-interactive
- Update help documentation

### Commit 3: Polish and validation
**What:** Handle edge cases
- Add input validation
- Error handling for failures
- Update success messaging
- Add tests

**Checkpoint:**
✅ Feature works end-to-end
✅ Documented in README
✅ Tests pass
✅ No regressions
```

---

## Example: Post-Launch Mini-Plan

### Bug Report: "TypeScript definitions download fails for older p5.js versions"

**Triage:**
- Type: Bug
- Severity: Medium (doesn't break core scaffolding)
- Complexity: Medium (need version fallback logic)
- Time: 1.5 hours, 2 commits

### Mini-Plan

#### Bug Fix: Handle missing TypeScript definitions

**Context:** Issue #23 - Types download fails for p5@1.4.0 and earlier
**Goal:** Gracefully fall back to latest available types
**Time:** 1.5 hours, 2 commits

**Commit 1: Add version fallback logic**
```
What: Detect 404 and try latest types
- Check response status in downloadTypeDefinitions()
- On 404, fetch latest available @types/p5 version
- Log warning that exact version not available
- Continue with fallback version
```

**Commit 2: Update config and messaging**
```
What: Inform user of fallback
- Store actual downloaded version in p5-config.json
- Show warning message during scaffolding
- Update success message to show which type version used
- Add note in README about type version matching
```

**Checkpoint:**
✅ Old p5.js versions can be scaffolded
✅ Users informed of type version mismatch
✅ Config accurately reflects installed types
✅ No errors during scaffolding

---

## Testing Strategy

### Manual Testing Checklist

Before each stage checkpoint:
- [ ] Interactive mode completes successfully
- [ ] Non-interactive mode with flags works
- [ ] Help documentation is accurate
- [ ] Error messages are helpful and clear
- [ ] No files left in broken state

Before final release:
- [ ] Test on macOS, Windows, Linux
- [ ] Test with npm, yarn, pnpm, bun
- [ ] All 4 templates scaffold correctly
- [ ] Update commands work in existing projects
- [ ] Mode switching works both directions
- [ ] Version selection shows correct data
- [ ] Git integration works (and gracefully fails if git not installed)
- [ ] Type definitions download for all templates
- [ ] README examples all work

### Automated Testing (Stage 10)

**Unit Tests:**
- Version fetching and parsing
- Config file read/write/update
- HTML manipulation and script injection
- Template file operations
- Argument parsing
- Path validation

**Integration Tests:**
- Full scaffolding workflow (interactive)
- Full scaffolding workflow (non-interactive)
- Update version in existing project
- Switch modes in existing project
- Network failure scenarios
- Invalid input handling

---

## Success Criteria

### MVP Complete When:
- ✅ All P0 features implemented (see PRODUCT_REQUIREMENTS.md)
- ✅ All 10 stages completed with passing checkpoints
- ✅ Test coverage >80% for core modules
- ✅ Manual testing passed on 3 platforms
- ✅ README and documentation complete
- ✅ No critical bugs in issue tracker
- ✅ Package published to npm as `create-p5@1.0.0`

### Quality Gates:
- Every commit leaves code in working state
- All tests pass before moving to next commit
- Code review before merging to main
- Version tags for each release

---

## Timeline Summary

| Stage | Focus | Time | Commits |
|-------|-------|------|---------|
| 1 | Proof of Concept | 3-4h | 4 |
| 2 | Dynamic Versions | 3-4h | 3 |
| 3 | Configuration | 2-3h | 3 |
| 4 | Delivery Modes | 4-5h | 4 |
| 5 | Templates & Types | 5-6h | 4 |
| 6 | Update Workflow | 5-6h | 4 |
| 7 | CLI & Git | 3-4h | 3 |
| 8 | Error Handling | 3-4h | 4 |
| 9 | Refactoring | 3-4h | 3 |
| 10 | Docs & Tests | 4-5h | 3 |
| **TOTAL** | **MVP** | **28-38h** | **35** |

**Target:** 1-2 weeks with focused development (4-6 hours/day)

---

## Notes

- Each stage should end with working, demo-able functionality
- STOP at checkpoints for approval before proceeding
- Adapt plan as needed, but maintain stage boundaries
- Document deviations from plan with rationale
- Keep main branch stable; use feature branches for stages
- Celebrate small wins at each checkpoint!

---

**Golden Rule:**
1. Make it work (Stages 1-6)
2. Make it right (Stages 7-9)
3. Make it complete (Stage 10)

**Remember:** Perfect is the enemy of done. Ship working software early and iterate based on feedback.
