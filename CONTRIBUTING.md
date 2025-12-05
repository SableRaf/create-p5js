# Contributing to create-p5js

Thank you for your interest in contributing to create-p5js! This document provides guidelines and instructions for developers who want to contribute to the project.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- npm, yarn, pnpm, or bun

### Local Development

To contribute or test local changes:

```bash
git clone https://github.com/SableRaf/create-p5.git
cd create-p5
npm install
npm link
```

This will create a global symlink for local testing.

Then you can run `npx create-p5js` from any directory to use your local version of the tool.

To uninstall the local link, run:

```bash
npm unlink -g create-p5js
```

### Testing

Unit tests are provided using Vitest. To run the test suite:

```bash
npm test
```

The tests include coverage for version fetching (mocked), HTML template injection, and configuration file read/write. Add more tests under the `tests/` directory as the codebase evolves.

## Development Guidelines

Please refer to the following documents for detailed development guidelines:

- [DOCUMENTATION_GUIDELINES.md](docs/DOCUMENTATION_GUIDELINES.md) - Coding standards and documentation practices
- [PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) - High-level product requirements and features
- [WORKFLOW_GUIDELINES.md](docs/WORKFLOW_GUIDELINES.md) - Development workflow and best practices
- [CLAUDE.md](CLAUDE.md) - All-purpose prompt for agent-based development.

## Commit Guidelines

Follow these principles for commits:

- **1-5 files changed** per commit
- **One purpose**: add feature OR refactor OR fix (not multiple)
- **Leaves code working** - must be testable after commit
- **Descriptive message** - concise but informative

Format: `type: short description` where type is `feat`, `fix`, `refactor`, `docs`, `test`, or `style`

Examples:
```
feat: add TypeScript template support
fix: resolve HTML parsing issue with nested tags
refactor: extract version fetching logic
docs: update README with new CLI options
```

## Pull Requests

When submitting a pull request:

1. Ensure all tests pass
2. Add tests for new features
3. Update documentation as needed
4. Follow the existing code style
5. Provide a clear description of changes

## Questions?

If you have questions or need help, please:

- Open an issue on GitHub
- Check existing documentation in the `docs/` directory
- Review the [CLAUDE.md](CLAUDE.md) file for architectural details
