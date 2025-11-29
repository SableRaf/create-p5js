# Implementation Plan: Filter Non-Stable Releases by Default

## Overview
Add functionality to filter out non-stable releases (RC, beta, alpha versions) from the version selection list by default, while providing an optional CLI flag `--include-prerelease` to show all versions including pre-release versions.

## Current Behavior
- `fetchVersions()` in [src/version.js](src/version.js) fetches all versions from the jsdelivr API
- Returns the first 15 versions from the API response (line 21)
- No filtering is applied - RC, beta, and alpha versions are included

## Target Behavior
- **Default mode**: Show only stable versions (semver-compliant: X.Y.Z format)
- **With `--include-prerelease` flag**: Show all versions including RC, beta, alpha (current behavior)
- Apply to both interactive prompts and flag-based version selection
- Apply to the `update` command as well

## Semver Pre-release Detection Strategy
A version is considered **stable** if it matches the pattern: `X.Y.Z` where X, Y, Z are integers.

A version is considered **pre-release** if it contains any of:
- `-rc.N` (release candidate)
- `-beta.N` (beta)
- `-alpha.N` (alpha)
- Any other `-suffix` pattern

**Regex pattern for stable versions**: `/^\d+\.\d+\.\d+$/`

## Implementation Steps

### Stage 1: Add Filtering Logic to version.js
**Files to modify**: [src/version.js](src/version.js)

1. Create a new helper function `isStableVersion(version)`:
   - Returns `true` if version matches `/^\d+\.\d+\.\d+$/`
   - Returns `false` for any version with pre-release suffix

2. Create a new helper function `filterStableVersions(versions)`:
   - Takes an array of version strings
   - Returns filtered array containing only stable versions
   - Uses `isStableVersion()` for filtering

3. Update `fetchVersions()` function:
   - Add optional parameter `includePrerelease` (default: `false`)
   - After fetching versions from API, apply filtering if `includePrerelease` is `false`
   - Still limit to 15 most recent versions AFTER filtering
   - Update JSDoc to document the new parameter

**Commit**: `feat: add stable version filtering utilities`

### Stage 2: Add CLI Flag Support
**Files to modify**: [index.js](index.js)

1. Add `--include-prerelease` to the minimist boolean flags (line 29)
2. Add alias `-p` for `--include-prerelease` (line 31-38)
3. Update help text to document the new flag (line 44-68):
   ```
   -p, --include-prerelease  Include pre-release versions (RC, beta, alpha)
   ```

**Commit**: `feat: add --include-prerelease CLI flag`

### Stage 3: Wire Flag Through to Version Fetching
**Files to modify**: [index.js](index.js)

1. Pass `args['include-prerelease']` to `fetchVersions()` call (line 119)
2. If flag is present and interactive mode, show a log message:
   ```
   p.log.info('Including pre-release versions (RC, beta, alpha)')
   ```

**Commit**: `feat: wire --include-prerelease flag to version fetching`

### Stage 4: Update the Update Command
**Files to modify**: [src/update.js](src/update.js)

1. Update `updateVersion()` function to accept options parameter:
   - Add optional `options` parameter with `includePrerelease` property
   - Pass `includePrerelease` to `fetchVersions()` call (line 86)

2. Update `update()` function to parse CLI args:
   - Import `minimist` at top of file
   - Parse `process.argv` to check for `--include-prerelease` flag
   - Pass options object to `updateVersion()` call

**Note**: This requires minimal changes since update command is already entry-point aware

**Commit**: `feat: support --include-prerelease in update command`

### Stage 5: Add Tests
**Files to modify**: [tests/version.test.js](tests/version.test.js)

Add new test cases:
1. Test `isStableVersion()`:
   - Returns `true` for "1.9.0", "2.1.1", "0.0.1"
   - Returns `false` for "2.1.0-rc.1", "1.9.0-beta.2", "1.8.0-alpha.1"

2. Test `filterStableVersions()`:
   - Filters out RC, beta, alpha versions
   - Preserves stable versions
   - Returns empty array if no stable versions

3. Test `fetchVersions()` with `includePrerelease`:
   - Mock API response with mixed stable and pre-release versions
   - Call with `includePrerelease: false` → only stable versions returned
   - Call with `includePrerelease: true` → all versions returned

**Commit**: `test: add tests for stable version filtering`

### Stage 6: Update Documentation
**Files to modify**:
- [README.md](README.md) - if it exists
- [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md)

Update documentation to reflect:
1. Default behavior filters pre-release versions
2. `--include-prerelease` flag shows all versions
3. Example usage in command examples

**Commit**: `docs: document --include-prerelease flag`

## Edge Cases to Handle

1. **All versions are pre-release**: If filtering results in empty array, fall back to showing all versions with a warning message
2. **Latest tag is pre-release**: The `latest` tag from API should always be used regardless of filtering (jsdelivr guarantees latest is stable)
3. **Limit of 15 versions**: Apply AFTER filtering, so users see 15 stable versions (not 15 total then filtered to 3)

## Files Changed Summary

| File | Purpose | Lines Changed |
|------|---------|---------------|
| src/version.js | Add filtering logic | ~30 |
| index.js | Add CLI flag, wire through | ~10 |
| src/update.js | Support flag in update | ~15 |
| tests/version.test.js | Add tests | ~40 |
| docs/*.md | Documentation | ~10 |

**Total**: ~5 files, ~105 lines changed across 6 commits

## Example Output

### Before (current behavior):
```
? Select p5.js version:
  ● 2.1.1 (latest)
  ○ 2.1.0
  ○ 2.1.0-rc.4
  ○ 2.1.0-rc.3
  ○ 2.1.0-rc.2
  ○ 2.1.0-rc.1
  ○ 2.0.0
```

### After (default, stable only):
```
? Select p5.js version:
  ● 2.1.1 (latest)
  ○ 2.1.0
  ○ 2.0.0
  ○ 1.9.0
  ○ 1.8.0
```

### After (with --include-prerelease flag):
```
Including pre-release versions (RC, beta, alpha)
? Select p5.js version:
  ● 2.1.1 (latest)
  ○ 2.1.0
  ○ 2.1.0-rc.4
  ○ 2.1.0-rc.3
  ○ 2.1.0-rc.2
  ○ 2.1.0-rc.1
  ○ 2.0.0
```

## Testing Strategy

1. **Unit tests**: Test helper functions with various version formats
2. **Integration tests**: Test full flow with mocked API responses
3. **Manual testing**:
   - Run `npm create p5@latest` and verify only stable versions shown
   - Run `npm create p5@latest -- --include-prerelease` and verify all versions shown
   - Run `npx create-p5 update` and verify stable filtering works
   - Run `npx create-p5 update --include-prerelease` and verify all versions shown

## Rollback Plan
If issues arise, the implementation is fully backward compatible:
- Setting `includePrerelease: true` restores current behavior
- No breaking changes to existing functionality
- Can be disabled by changing default parameter value
