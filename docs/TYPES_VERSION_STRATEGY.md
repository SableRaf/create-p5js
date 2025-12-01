# TypeScript Definitions Version Strategy

This document describes how create-p5 handles TypeScript type definitions for different p5.js versions.

## The Problem

The @types/p5 package uses its own versioning scheme (latest: 1.7.7) that doesn't directly match p5.js versions (latest: 2.1.1). Additionally, p5.js started bundling its own TypeScript definitions starting from version 2.0.2.

## The Solution

We use a two-tier strategy based on the p5.js version:

### For p5.js 1.x (versions 1.0.0 - 1.11.x)

**Use @types/p5 package from DefinitelyTyped**

- Source: `https://cdn.jsdelivr.net/npm/@types/p5@<version>/`
- Latest available: `@types/p5@1.7.7`
- Files needed:
  - `index.d.ts` - For instance mode
  - `global.d.ts` - For global mode (references index.d.ts)

**Version matching logic:**
1. Fetch available @types/p5 versions from jsdelivr API
2. Find closest match by major.minor version (highest patch in same minor)
3. If exact minor not available, find closest minor within same major
4. Select highest patch version within matched minor

**Example mappings:**
- p5.js 1.4.0 → @types/p5@1.4.3 (highest patch in 1.4.x)
- p5.js 1.7.0 → @types/p5@1.7.7 (highest patch in 1.7.x)
- p5.js 1.9.0 → @types/p5@1.7.7 (closest available, 1.9.x doesn't exist)
- p5.js 1.11.0 → @types/p5@1.7.7 (closest available, 1.11.x doesn't exist)

### For p5.js 2.x (versions 2.0.2+)

**Use bundled types from p5 package itself**

- Source: `https://cdn.jsdelivr.net/npm/p5@<version>/types/`
- Available starting from: `p5@2.0.2`
- Files needed:
  - `p5.d.ts` - For instance mode
  - `global.d.ts` - For global mode (references p5.d.ts)

**Version matching logic:**
1. Try exact version match first (e.g., p5@2.1.1 → p5@2.1.1/types/)
2. If not available, fetch all p5.js versions and find closest 2.x match
3. Use same algorithm as 1.x: prefer exact minor, then closest minor

**Example mappings:**
- p5.js 2.0.0 → p5@2.0.2/types/ (closest 2.x with bundled types)
- p5.js 2.0.1 → p5@2.0.2/types/ (closest 2.x with bundled types)
- p5.js 2.0.2 → p5@2.0.2/types/ (exact match)
- p5.js 2.1.1 → p5@2.1.1/types/ (exact match)

## File Structure Differences

### @types/p5 (for 1.x)
```
@types/p5@1.7.7/
├── index.d.ts       # Main definitions (instance mode)
├── global.d.ts      # Global mode augmentation
├── constants.d.ts   # Constants
├── literals.d.ts    # Literal types
└── ...
```

### p5 bundled types (for 2.x)
```
p5@2.1.1/types/
├── p5.d.ts          # Main definitions (instance mode)
└── global.d.ts      # Global mode augmentation
```

## Implementation Details

The `downloadTypeDefinitions()` function in `src/version.js`:

1. **Determine strategy** - `getTypesStrategy(version)` checks major version:
   - Major version 1: Use @types/p5 package
   - Major version 2+: Use bundled types from p5 package

2. **For p5.js 1.x (@types/p5)**:
   - Call `fetchTypesVersions()` to get available @types/p5 versions
   - Call `findClosestVersion(version, typesVersions)` to match
   - Download from `@types/p5@{matchedVersion}/`

3. **For p5.js 2.x (bundled types)**:
   - Try to download from `p5@{version}/types/` first
   - If 404, call `fetchVersions()` to get all p5.js versions
   - Call `findClosestVersion(version, p5Versions)` to find fallback
   - Download from `p5@{matchedVersion}/types/`

4. **File selection based on template**:
   - Instance mode: Only main file (p5.d.ts or index.d.ts)
   - Global mode: Both global.d.ts and main file

5. **Return actual version** downloaded for storage in p5-config.json

### Helper Functions

- `parseVersion(version)` - Parses semver into components (major, minor, patch, prerelease)
- `fetchTypesVersions()` - Fetches available @types/p5 versions from jsdelivr API
- `findClosestVersion(target, available)` - Matches by major.minor, prefers exact, then closest
- `getTypesStrategy(version)` - Determines bundled vs @types/p5 strategy

## Edge Cases

- **Very old versions (0.x)**: Uses @types/p5 strategy, finds closest 1.x types
- **Pre-release versions (e.g., 2.1.0-rc.1)**: Parsed correctly, uses base version for matching
- **Future versions (3.x+)**: Assumes bundled types, follows 2.x strategy
- **No matching version found**: Throws error with clear message
- **Network failures**: Graceful error handling with user-friendly messages

## References

- [@types/p5 on npm](https://www.npmjs.com/package/@types/p5)
- [p5-types/p5.ts on GitHub](https://github.com/p5-types/p5.ts)
- [DefinitelyTyped versioning](https://stackoverflow.com/questions/43071705/how-to-relate-a-version-of-types-package-to-the-versions-of-the-associated-js-p)
