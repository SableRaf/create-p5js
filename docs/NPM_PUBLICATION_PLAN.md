# NPM Publication Plan

Simple step-by-step guide for publishing create-p5 to npm.

## Prerequisites

- [ ] npm account created at [npmjs.com](https://www.npmjs.com/)
- [ ] npm CLI installed (comes with Node.js)
- [ ] Logged into npm locally: `npm login`
- [ ] All tests passing: `npm test`
- [ ] Package name "create-p5" is available on npm

## Pre-Publication Checklist

### 1. Verify Package Metadata
- [ ] Check [package.json](../package.json) has correct:
  - `name`: "create-p5"
  - `version`: "0.1.0" (or appropriate version)
  - `description`: Clear and concise
  - `keywords`: Relevant search terms
  - `license`: "LGPL-2.1"
  - `author`: Fill in author information
  - `repository`: Add GitHub repository URL
  - `bugs`: Add GitHub issues URL
  - `homepage`: Add project homepage

### 2. Add .npmignore
Create `.npmignore` to exclude unnecessary files:
```
tests/
docs/
.github/
*.log
.DS_Store
coverage/
.vscode/
```

### 3. Test Locally
```bash
# Create a tarball to see what will be published
npm pack

# Check the contents
tar -tzf create-p5-*.tgz

# Test installation locally in another directory
npm install -g ./create-p5-*.tgz
npm create p5@latest test-project
```

### 4. Final Code Review
- [ ] All documentation up to date
- [ ] README.md has installation and usage instructions
- [ ] CHANGELOG.md exists (if applicable)
- [ ] All tests passing: `npm test`
- [ ] No console.log or debug statements
- [ ] Version number is correct

## Publication Steps

### Step 1: Ensure Clean Git State
```bash
git status
# Commit any pending changes
git add .
git commit -m "chore: prepare for npm publication"
```

### Step 2: Run Tests One More Time
```bash
npm test
```

### Step 3: Verify npm Login
```bash
npm whoami
# Should show your npm username
```

### Step 4: Dry Run
```bash
npm publish --dry-run
# Review the output to see what will be published
```

### Step 5: Publish to npm
```bash
npm publish
```

### Step 6: Verify Publication
```bash
# Check the package page
open https://www.npmjs.com/package/create-p5

# Test installation
npx create-p5@latest test-project
```

### Step 7: Tag the Release
```bash
git tag v0.1.0
git push origin v0.1.0
git push origin main
```

### Step 8: Create GitHub Release
- Go to GitHub repository → Releases → Create new release
- Tag: v0.1.0
- Title: "v0.1.0 - Initial Release"
- Description: Summarize features and changes

## Post-Publication

- [ ] Test installation: `npm create p5@latest`
- [ ] Update documentation with npm installation instructions
- [ ] Announce on relevant channels (if applicable)
- [ ] Monitor for issues on GitHub

## Publishing Updates

For subsequent versions:

1. **Update version number:**
   ```bash
   # Patch (0.1.0 → 0.1.1)
   npm version patch

   # Minor (0.1.0 → 0.2.0)
   npm version minor

   # Major (0.1.0 → 1.0.0)
   npm version major
   ```

2. **Publish:**
   ```bash
   npm publish
   git push && git push --tags
   ```

## Troubleshooting

**"Package name already exists"**
- Check if name is taken: `npm search create-p5`
- Consider alternative name or contact current owner

**"You must verify your email"**
- Check npm email verification
- Visit npmjs.com profile settings

**"Authentication failed"**
- Run `npm login` again
- Check credentials at npmjs.com

**"Published but not working"**
- Check `bin` field in package.json points to correct file
- Verify index.js has shebang: `#!/usr/bin/env node`
- Check file permissions: `chmod +x index.js`

## Notes

- npm packages named `create-*` work with `npm create` command
- Users can run: `npm create p5@latest` (equivalent to `npx create-p5@latest`)
- Always test in clean environment before publishing
- Version numbers follow [Semantic Versioning](https://semver.org/)
