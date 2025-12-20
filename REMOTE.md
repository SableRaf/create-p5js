# Remote Templates

create-p5 supports fetching templates from remote Git repositories, allowing you to use community templates or your own custom project starters.

## Quick Start

Use the `--template` flag with any supported format:

```bash
npx create-p5 my-project --template user/repo
```

## Supported Git Hosts

create-p5 supports templates from **GitHub** and **Codeberg**, with multiple syntax options for each.

### GitHub

GitHub is the default host. All these formats are equivalent:

```bash
# Shorthand (recommended)
npx create-p5 my-project --template user/repo

# Explicit GitHub prefix
npx create-p5 my-project --template github:user/repo

# SSH format
npx create-p5 my-project --template git@github.com:user/repo

# HTTPS URL
npx create-p5 my-project --template https://github.com/user/repo
```

### Codeberg

Codeberg requires an explicit prefix or URL:

```bash
# Codeberg prefix (recommended)
npx create-p5 my-project --template codeberg:user/repo

# SSH format
npx create-p5 my-project --template git@codeberg.org:user/repo

# HTTPS URL
npx create-p5 my-project --template https://codeberg.org/user/repo
```

## Branches, Tags, and Commits

Specify a specific branch, tag, or commit using `#`:

```bash
# Specific branch
npx create-p5 my-project --template user/repo#develop

# Release tag
npx create-p5 my-project --template user/repo#v1.2.3

# Commit hash
npx create-p5 my-project --template user/repo#1234abcd

# Works with any format
npx create-p5 my-project --template codeberg:user/repo#main
npx create-p5 my-project --template git@github.com:user/repo#dev
```

**Default branch:** If no ref is specified, `main` is used as the default.

## Subdirectories

Clone only a specific subdirectory from a repository:

```bash
# GitHub subdirectory
npx create-p5 my-project --template user/repo/examples/basic

# Codeberg subdirectory
npx create-p5 my-project --template codeberg:user/repo/templates/starter

# Subdirectory with specific branch
npx create-p5 my-project --template user/repo/examples/advanced#v2.0

# SSH format with subdirectory
npx create-p5 my-project --template git@codeberg.org:user/repo/templates#main
```

## Single Files

Download a single file from a repository:

```bash
# GitHub single file
npx create-p5 my-project --template user/repo/template.html

# GitHub blob URL (from web browser)
npx create-p5 my-project --template https://github.com/user/repo/blob/main/index.html

# Codeberg single file
npx create-p5 my-project --template codeberg:user/repo/README.md

# Codeberg with src/branch/ref path (from web browser)
npx create-p5 my-project --template codeberg:user/repo/src/branch/main/template.js

# Codeberg web URL
npx create-p5 my-project --template https://codeberg.org/user/repo/src/branch/main/sketch.js

# SSH format with single file
npx create-p5 my-project --template git@codeberg.org:user/repo/src/branch/main/index.html
```

**Note:** Single files are downloaded into a directory, not as a standalone file.

## Web Browser URLs

You can copy URLs directly from your browser:

### GitHub

```bash
# Repository home page
https://github.com/user/repo
# → Downloads entire repo

# Tree view (directory)
https://github.com/user/repo/tree/main/examples
# → Downloads examples directory

# Blob view (single file)
https://github.com/user/repo/blob/main/template.html
# → Downloads template.html into a directory
```

### Codeberg

```bash
# Repository home page
https://codeberg.org/user/repo
# → Downloads entire repo

# Branch view with path
https://codeberg.org/user/repo/src/branch/main/templates
# → Downloads templates directory from main branch

# Single file view
https://codeberg.org/user/repo/src/branch/main/README.md
# → Downloads README.md into a directory
```

## Complete Syntax Reference

### GitHub Formats

| Format | Example | Description |
|--------|---------|-------------|
| Shorthand | `user/repo` | Default, downloads from GitHub |
| With branch | `user/repo#branch` | Specific branch/tag/commit |
| With subdirectory | `user/repo/path/to/dir` | Subdirectory only |
| With both | `user/repo/path/to/dir#v1.0` | Subdirectory at specific ref |
| Explicit prefix | `github:user/repo` | Same as shorthand |
| SSH | `git@github.com:user/repo` | SSH-style syntax |
| HTTPS | `https://github.com/user/repo` | Full HTTPS URL |
| Tree URL | `https://github.com/user/repo/tree/main/path` | Browser tree view |
| Blob URL | `https://github.com/user/repo/blob/main/file.js` | Browser file view |

### Codeberg Formats

| Format | Example | Description |
|--------|---------|-------------|
| Prefix | `codeberg:user/repo` | Codeberg shorthand |
| With branch | `codeberg:user/repo#branch` | Specific branch/tag/commit |
| With subdirectory | `codeberg:user/repo/path/to/dir` | Subdirectory only |
| With both | `codeberg:user/repo/path#v1.0` | Subdirectory at specific ref |
| SSH | `git@codeberg.org:user/repo` | SSH-style syntax |
| HTTPS | `https://codeberg.org/user/repo` | Full HTTPS URL |
| Web URL with path | `https://codeberg.org/user/repo/src/branch/main/path` | Browser view |
| Shorthand with src/branch | `codeberg:user/repo/src/branch/main/file.js` | Browser-style path in shorthand |
| SSH with src/branch | `git@codeberg.org:user/repo/src/branch/main/file.js` | Browser-style path in SSH format |

## Examples

### Using a GitHub template

```bash
# Use p5.js TypeScript template
npx create-p5 my-sketch --template processing/p5.js-website/tree/main/src/templates/pages/libraries/index.njk

# Use someone's starter project
npx create-p5 my-game --template gamedev/p5-starter

# Use a specific version
npx create-p5 my-project --template studio/templates/basic#v2.1.0
```

### Using a Codeberg template

```bash
# Use a Codeberg template
npx create-p5 my-project --template codeberg:blazp/p5js_template

# Use specific file from Codeberg
npx create-p5 single-file --template codeberg:user/repo/src/branch/main/sketch.js

# Copy from Codeberg web URL
npx create-p5 my-sketch --template https://codeberg.org/user/p5-templates/src/branch/main/basic
```

### Advanced usage

```bash
# Nested subdirectory with specific commit
npx create-p5 my-app --template user/monorepo/packages/p5-template#abc1234

# Private repo via SSH (must have access)
npx create-p5 private-project --template git@github.com:myorg/private-templates

# Mix and match: Codeberg SSH with subdirectory and branch
npx create-p5 my-project --template git@codeberg.org:user/templates/starters/game#dev
```

## How It Works

1. **Automatic detection**: create-p5 detects which Git host you're using based on the URL or prefix
2. **Smart parsing**: Web URLs from GitHub and Codeberg are automatically converted to the correct format
3. **Fallback mechanism**: If degit fails (degit doesn't support Codeberg), create-p5 automatically falls back to direct archive downloads
4. **Single-file handling**: Single files are detected and downloaded using the appropriate API

## Differences from degit

create-p5's template fetching is inspired by [degit](https://github.com/Rich-Harris/degit) but with additional features:

- ✅ **Codeberg support**: Native support for Codeberg repositories
- ✅ **Single-file downloads**: Download individual files, not just directories
- ✅ **Browser URL compatibility**: Paste URLs directly from GitHub/Codeberg web interface
- ✅ **Automatic fallback**: Uses archive downloads when degit isn't available
- ⚠️ **No private repos**: Currently doesn't support private repositories

## Limitations

- **Private repositories**: Not currently supported (public repos only)
- **Other Git hosts**: Only GitHub and Codeberg are supported (GitLab, Bitbucket, etc. are not supported)
- **Authentication**: No authentication mechanism for private repositories

## Troubleshooting

### Template not found

```bash
# ✗ Wrong - this will fail
npx create-p5 my-project --template nonexistent/repo

# ✓ Correct - verify the repository exists first
# Visit https://github.com/nonexistent/repo to check
```

### Wrong branch/tag

```bash
# ✗ Wrong - branch doesn't exist
npx create-p5 my-project --template user/repo#nonexistent-branch

# ✓ Correct - check available branches on GitHub/Codeberg
npx create-p5 my-project --template user/repo#main
```

### Subdirectory not found

```bash
# ✗ Wrong - path doesn't exist
npx create-p5 my-project --template user/repo/wrong/path

# ✓ Correct - verify the path exists in the repository
npx create-p5 my-project --template user/repo/examples
```

### Use --verbose for debugging

```bash
# Get detailed output about what's happening
npx create-p5 my-project --template user/repo --verbose
```

## Related

- [GitHub Templates](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
- [Codeberg](https://codeberg.org)
- [degit](https://github.com/Rich-Harris/degit) - The inspiration for remote template support

## Contributing

Want to add support for more Git hosts? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting pull requests.
