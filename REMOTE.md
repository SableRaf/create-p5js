# Remote Templates

create-p5 supports fetching templates from remote Git repositories, allowing you to use community templates or your own custom project starters.

It uses [degit](https://github.com/Rich-Harris/degit) under the hood with additional features (like support for Codeberg repositories) and fallbacks for single-file downloads.

## Quick Start

Use the `--template` flag with any supported format:

```bash
npx create-p5 my-project --template user/repo
```

## Supported Git Hosts

create-p5 supports all git providers supported by degit (**GitHub**, **GitLab**, **Bitbucket**, and **Sourcehut**) and adds support for **Codeberg**.

GitHub is the default host. Other hosts can be specified using their respective prefixes:

```bash
# GitHub (via degit)
npx create-p5 my-project --template user/repo
npx create-p5 my-project --template github:user/repo
npx create-p5 my-project --template git@github.com:user/repo
npx create-p5 my-project --template https://github.com/user/repo

# Bitbucket (via degit)
npx create-p5 my-project --template bitbucket:user/repo
npx create-p5 my-project --template git@bitbucket.org:user/repo
npx create-p5 my-project --template https://bitbucket.org/user/repo

# GitLab (via degit)
npx create-p5 my-project --template gitlab:user/repo
npx create-p5 my-project --template git@gitlab.com:user/repo
npx create-p5 my-project --template https://gitlab.com/user/repo

# Sourcehut (via degit)
npx create-p5 my-project --template git.sr.ht:user/repo
npx create-p5 my-project --template git@git.sr.ht:user/repo
npx create-p5 my-project --template https://git.sr.ht/user/repo

# Codeberg (via custom support)
npx create-p5 my-project --template codeberg:user/repo
npx create-p5 my-project --template git@codeberg.org:user/repo
npx create-p5 my-project --template https://codeberg.org/user/repo
```

## Subdirectories

Clone only a specific subdirectory from a repository:

```bash
# GitHub subdirectory
npx create-p5 my-project --template user/repo/examples/basic

# Codeberg subdirectory
npx create-p5 my-project --template codeberg:user/repo/templates/starter
```

## Single Files

You can download individual files from a repository instead of the whole project structure, using the same syntax as above. For example:

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

**Note:** Single files are downloaded into the default project directory (`my-project` in the examples above), not as a standalone file.

## Branch, Tag, and Commit Support

> [!WARNING]
> Support for branches, tags, and commit hashes is untested and unsupported. See the [degit documentation](https://github.com/Rich-Harris/degit) for details.

## Differences from degit

create-p5's template fetching is built upon [degit](https://github.com/Rich-Harris/degit) and makes some changes and additions:

### Enhancements

- ✅ **Codeberg support**: Native support for Codeberg repositories with degit-like syntax.
- ✅ **Single-file downloads**: Download individual files, not just directories
- ✅ **Browser URL compatibility**: Paste URLs directly from GitHub/Codeberg web interface

### Limitations

- No private repository support at this time.

## Troubleshooting

This is a work in progress and may not cover all edge cases. If you run into issues, try the following steps:

### Use --verbose for debugging

```bash
# Get detailed output about what's happening
npx create-p5 my-project --template user/repo --verbose
```
