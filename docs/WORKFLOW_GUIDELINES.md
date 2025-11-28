## Development philosophy

- Atomic commits: one purpose each. Small, focused changes.
- Incremental: build in small, testable steps, with only the level of complexity necessary for that step.
- Code against APIs, not implementations: Expose stable contracts and keep internal details hidden so implementations can change without breaking callers.
- Single responsibility principle: Each module/class/function should have one focused purpose.
- Make it work → make it right → make it fast
- DRY principles: Avoid duplication through abstraction and reuse.
- Tests: Automated tests for all new features and bug fixes. Run tests after each commit (after initial PoC)
- Documentation: Document all public APIs and complex logic. Update docs with code changes.
- Build for flexibility, testability, and long-term maintainability.

## Core Workflow 

```
Generate a plan with:
1. 6-10 logical stages building on each other
2. 2-4 atomic commits per stage
3. Clear checkpoints after each stage
4. Time estimates
5. Iteration workflows for post-launch changes
```

Save the output as `IMPLEMENTATION_PLAN.md` in the project root.

---

## Stage Structure

### Standard Progression

```
Stage 1: Proof of Concept - Hardcoded, single feature, validates approach
Stage 2: Dynamic Input - Real data, user choices
Stage 3: Persistence - Save/load state
Stage 4: Alternative Modes - Different paths through the system
Stage 5: Extended Features - Non-core functionality
Stage 6: Refactoring - DRY, modularity (only after features work)
Stage 7: Error Handling - Validation, edge cases
Stage 8: Documentation - README, examples
```

### Stage Template

```markdown
## Stage N: [Goal]
**Goal**: [One sentence describing what this stage achieves]

### Commit 1: [Action]
**What**: [One sentence]
- [Specific change]
- [Specific change]
- [Specific change]

### Commit 2: [Action]
**What**: [One sentence]
- [Specific change]
- [Specific change]

**Checkpoint**: [Demo-able capability]. **Ship it.**
**Time**: [X hours, Y commits]
```

---

## Commit Guidelines

### Rules

- **1-5 files changed**
- **15-60 minutes** to implement
- **One purpose**: add feature OR refactor OR fix (not multiple)
- **Leaves code working** - must be testable after commit
- **Descriptive message** - clear what, why, how. Concise but informative.
- **Renaming/moving files/folders MUST be a separate commit** - never combined with other changes.

### Format

```bash
type: short description

- What changed
- Why it changed
- How to test it
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `style`

### Examples

**Good commits:**
```
feat: add user authentication
- Create login form component
- Add JWT token validation
- Store user session in localStorage

fix: handle missing email field
- Add validation before submit
- Show error message to user
- Prevent form submission

refactor: extract API client
- Move all fetch calls to api/client.js
- Centralize error handling
- No behavior changes
```

**Bad commits:**
```
update stuff (vague, unclear what changed)
fix everything (too broad, multiple concerns)
WIP authentication (not in working state)
```

---

## Checkpoints

After each stage, define what is demo-able:

**Format:**
```
**Checkpoint**: [Specific user-visible capability]. **Ship it.**
```

**Good checkpoints:**
```
✅ Users can create and view todo items
✅ Data persists between browser sessions
✅ Errors show helpful messages with recovery steps
```

**Bad checkpoints:**
```
❌ API layer is complete (too technical)
❌ Almost done (not concrete)
❌ Architecture is solid (not testable)
```

✋ STOP SIGN: At each checkpoint, halt development, demo the feature, and get approval before proceeding to the next stage.

---

## Time Estimates

### Per Commit Type

- Simple feature: 30-60 min
- API integration: 45-90 min
- Refactoring: 60-120 min
- Documentation: 30-45 min

### Reality Checks

- Stage > 8 hours → split it
- Commit > 2 hours → break it down
- Total > 40 hours → multiple epics needed

---

## Best Practices Section

Every plan should include:

```markdown
## Development Best Practices

### 1. Test After Each Commit
[Specific commands for this project]

### 2. Commit Message Format
[Examples with project context]

### 3. Keep Main Files Simple
[What good structure looks like]

### 4. One Thing Breaks? Stop and Fix
[Debugging approach]

### 5. Don't Add While Refactoring
[Maintain discipline]

### 6. Renaming and Moving Files
[How to handle safely]

### 7. Document as You Go
[When and what to document]
```

---

## Red Flags Section

Include 4-6 project-specific warnings:

```markdown
## Red Flags

🚩 **"While I'm here..."** → Save it for later
🚩 **Commit touches 10+ files** → Break it down
🚩 **"Almost done" on day 3 of Stage 1** → Over-engineering
🚩 **No demo after 5 commits** → Increments too small or broken
🚩 **Refactoring in Stage 2** → Too early, features first
🚩 **Skipping tests "temporarily"** → Technical debt starts
🚩 **Renaming or moving files without a separate commit** → Hard to review and track history
```

---

## Iteration Workflows

### Triage Framework

```
Feedback received
├─ Bug?
│  ├─ Critical (breaks core) → HOT FIX (immediate, 1 commit)
│  └─ Non-critical → MINI-PLAN (1-3 commits)
└─ Feature/Enhancement?
   ├─ Small (<1 hour) → Single commit
   ├─ Medium (1-3 hours) → Mini-plan (2-4 commits)
   └─ Large (>3 hours) → Full stage plan
```

### Decision Matrix

| Type | Files | Time | Needs Plan? |
|------|-------|------|-------------|
| Typo/docs | 1 | 5 min | ❌ |
| Simple bug | 1-2 | <30 min | ❌ |
| Complex bug | 3+ | >1 hour | ✅ |
| Small enhancement | 1-2 | <1 hour | ⚠️ |
| New feature | 3+ | >2 hours | ✅ |
| Refactoring | 2+ | >1 hour | ✅ |

---

## Mini-Plan Templates

### Bug Fix Template

```markdown
## Bug Fix: [Specific error]

**Context**: [Issue number] - [Problem description]
**Goal**: [Expected behavior]
**Time**: [X hours, Y commits]

### Commit 1: Add failing test
**What**: Reproduce the bug
- Create test case
- Verify it fails
- Document expected behavior

### Commit 2: Fix the issue
**What**: Implement solution
- [Specific fix]
- Verify test passes
- Check for regressions

**Checkpoint**:
✅ Bug no longer occurs
✅ Tests pass
✅ No side effects
```

### Feature Addition Template

```markdown
## Feature: [New capability]

**Context**: [Why needed]
**Goal**: Users can [action]
**Time**: [X hours, Y commits]

### Commit 1: Basic implementation
**What**: Minimal working version
- [Core change]
- [Core change]

### Commit 2: Add UI/Integration
**What**: Connect to existing system
- [Integration point]
- [User interface]

### Commit 3: Polish
**What**: Handle edge cases
- [Validation]
- [Error handling]

**Checkpoint**:
✅ Feature works end-to-end
✅ Documented
✅ No regressions
```

### Refactoring Template

```markdown
## Refactor: [What needs cleanup]

**Context**: [Code smell or duplication]
**Goal**: [Maintainability improvement]
**Time**: [X hours, Y commits]
**Risk**: [Low/Medium/High]

### Safety Checklist
- [ ] All tests pass before starting
- [ ] New branch created
- [ ] No new features during refactor
- [ ] Tests pass after each commit

### Commit 1: Extract [component]
**What**: [Specific refactoring]
- [Change]
- No behavior changes

**Test**: All tests still pass

### Commit 2: Simplify [area]
**What**: [Specific improvement]
- [Change]
- No behavior changes

**Test**: All tests still pass

**Checkpoint**:
✅ Code cleaner
✅ All tests pass
✅ No behavior changes
```

---

## Iteration Anti-Patterns

### "Quick Fix" Trap
```
Problem: "Just quickly add..."
Result: No plan, scope creep, breaks things
Solution: Even "quick" changes need a commit plan
```

### "While I'm Here" Syndrome
```
Problem: Fixing bug + refactoring + new feature in one commit
Result: Unreviewable, risky, hard to debug
Solution: Fix bug, ship it, then plan other work separately
```

### "Just Ship It" Approach
```
Problem: Skip tests and planning for "urgent" work
Result: Technical debt, more bugs, slower overall
Solution: Hot fixes only for critical issues, otherwise plan it
```

### "Eternal PR" Problem
```
Problem: 300 files, 47 commits, one massive PR
Result: Unreviewable, blocks progress, usually rejected
Solution: Multiple small PRs following stage boundaries
```

---

## Example: Simple Web App

```markdown
# Incremental Plan: Todo List App

## Stage 1: Proof of Concept
**Goal**: Hardcoded todo items display in list
**Time**: 1 hour, 2 commits

### Commit 1: Project setup
**What**: Basic HTML/CSS/JS structure
- Create index.html with empty ul
- Add styles.css with basic layout
- Add app.js with empty functions

### Commit 2: Display hardcoded items
**What**: Show static todos
- Create array with 3 hardcoded todos
- Loop through and create li elements
- Append to DOM

**Checkpoint**: Page shows 3 todo items. **Ship it.**

---

## Stage 2: Dynamic Input
**Goal**: Users can add their own todos
**Time**: 1.5 hours, 3 commits

### Commit 1: Add input form
**What**: Create UI for new todos
- Add input field and button
- Basic form styling
- Wire up submit event (logs to console)

### Commit 2: Add items to DOM
**What**: Create todo from input
- Read input value on submit
- Create new li element
- Append to list
- Clear input

### Commit 3: Basic validation
**What**: Prevent empty todos
- Check input is not empty
- Show error message if empty
- Disable button when input empty

**Checkpoint**: Users can add todos via form. **Ship it.**

---

## Stage 3: Persistence
**Goal**: Todos survive page refresh
**Time**: 1 hour, 2 commits

### Commit 1: Save to localStorage
**What**: Store todos in browser
- Convert array to JSON
- Save to localStorage on changes
- Verify data persists

### Commit 2: Load from localStorage
**What**: Restore todos on page load
- Read from localStorage on init
- Parse JSON back to array
- Render loaded items

**Checkpoint**: Todos persist between sessions. **Ship it.**

---

## Stage 4: Delete Functionality
**Goal**: Users can remove todos
**Time**: 1 hour, 2 commits

### Commit 1: Add delete buttons
**What**: UI for removing items
- Add X button to each todo
- Style button
- Wire up click handler (logs only)

### Commit 2: Implement delete
**What**: Remove from array and DOM
- Remove from data array
- Update localStorage
- Remove DOM element

**Checkpoint**: Users can delete todos. **Ship it.**

---

## Stage 5: Complete/Uncomplete
**Goal**: Mark todos as done
**Time**: 1.5 hours, 2 commits

### Commit 1: Toggle completion
**What**: Track completed state
- Add completed boolean to todo objects
- Toggle on click
- Update localStorage

### Commit 2: Visual feedback
**What**: Show completion state
- Add .completed CSS class
- Strikethrough completed items
- Gray out text

**Checkpoint**: Users can mark todos complete. **Ship it.**

---

## Stage 6: Refactoring
**Goal**: Clean, maintainable code
**Time**: 2 hours, 3 commits

### Commit 1: Extract storage functions
**What**: Centralize localStorage logic
- Create saveTodos() function
- Create loadTodos() function
- Replace all localStorage calls

### Commit 2: Extract render function
**What**: Separate rendering logic
- Create renderTodos() function
- Single source for creating DOM elements
- Replace all manual DOM manipulation

### Commit 3: Add input validation module
**What**: Reusable validation
- Create validateTodo() function
- Centralize all validation rules
- Return clear error messages

**Checkpoint**: Code is DRY and modular. **Ship it.**

---

## Stage 7: Error Handling
**Goal**: Graceful failure handling
**Time**: 1 hour, 2 commits

### Commit 1: Handle localStorage errors
**What**: Deal with storage failures
- Try/catch around localStorage
- Fallback to memory-only mode
- Show warning to user

### Commit 2: Improve user feedback
**What**: Better error messages
- Show specific validation errors
- Success confirmation on add
- Clear error states

**Checkpoint**: App handles errors gracefully. **Ship it.**

---

## Stage 8: Documentation
**Goal**: Clear usage instructions
**Time**: 30 minutes, 1 commit

### Commit 1: Add README
**What**: Document the project
- How to use
- Feature list
- Technical details
- Future improvements

**Checkpoint**: Project is documented. **Ship it.**

---

## Development Best Practices

### 1. Test After Each Commit
```bash
# Open index.html in browser
# Test new functionality
# Test existing functionality didn't break
```

### 2. Commit Messages
```bash
git commit -m "feat: add delete button to todo items"
git commit -m "fix: prevent empty todos from being added"
git commit -m "refactor: extract localStorage to storage module"
```

### 3. Keep app.js Organized
By Stage 6, your code should have clear sections:
```javascript
// Data
let todos = [];

// Storage
function saveTodos() { }
function loadTodos() { }

// Rendering
function renderTodos() { }

// Actions
function addTodo() { }
function deleteTodo() { }
function toggleTodo() { }

// Init
init();
```

### 4. One Thing Breaks? Stop and Fix
If adding delete breaks add functionality, stop. Fix the regression before continuing.

### 5. Don't Refactor While Adding Features
Stage 6 is for refactoring only. Don't add new features during cleanup.

---

## Red Flags

🚩 **"Let me also add edit functionality..."** → One feature at a time
🚩 **Commit changes 8 files** → Too big, break it down
🚩 **Still working on Stage 1 after 3 hours** → Overcomplicating
🚩 **Skipped localStorage tests** → Will cause problems later
🚩 **Refactoring in Stage 2** → Too early, wait until Stage 6

---

## Iteration Example: Post-Launch Bug

### Bug Report
"App crashes when localStorage is full"

### Triage
- Type: Bug
- Severity: High (crashes app)
- Complexity: Medium (need quota handling)
- Time: 1.5 hours, 2 commits

### Mini-Plan

#### Bug Fix: Handle localStorage quota exceeded

**Context**: Issue #12 - App crashes when storage full
**Goal**: Graceful degradation when quota exceeded
**Time**: 1.5 hours, 2 commits

**Commit 1: Add quota detection**
```
What: Detect QuotaExceededError
- Wrap saveTodos in try/catch
- Catch QuotaExceededError specifically
- Log error to console
```

**Commit 2: Fallback to memory mode**
```
What: Continue working without persistence
- Set flag when quota exceeded
- Show warning banner to user
- Keep todos in memory only
- Explain how to free space
```

**Checkpoint**:
✅ App doesn't crash when storage full
✅ User sees helpful warning
✅ Can still use app in current session
```

---

**Golden Rule:**
1. Make it work (Stages 1-5)
2. Make it right (Stage 6)
3. Make it fast (Stage 7)