# create-p5js

A scaffolding tool for quickly creating and managing [p5.js](https://p5js.org/) projects using the `npm create` convention. It provides both interactive and non-interactive modes for project creation, along with utilities to update existing projects safely.

![create-p5 CLI Demo](images/create-p5-CLI-demo.gif)

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)

## Installation Options

You can use `create-p5` in three ways, depending on how often you plan to use it and how much you want installed on your system.

### 1. One-off use (recommended for most people)

```bash
npm create p5js
```

This downloads and runs the latest version of `create-p5js` without installing anything globally.
Good when you only need the tool occasionally or want to stay up to date automatically.

### 2. Run without installing (using `npx`)

```bash
npx create-p5js
```

This runs the tool from npm each time.
Useful when:

* you want to use subcommands like `npx create-p5js update`
* you prefer calling the CLI directly instead of using the `npm create` prefix

### 3. Install globally

```bash
npm install -g create-p5js
```

This makes the `create-p5js` command available system-wide:

```bash
create-p5js
```

You might prefer this if:

* you create many projects regularly
* you want the same version every time until you update it yourself
* you need offline usage after initial installation

---

If you want, I can integrate this directly into your README in the right place and match the formatting.

> [!NOTE]
> This version refers to the scaffolding tool itself, not the p5.js library version in your project.

## Usage

### Create a New p5.js Project
To create a new p5.js project, navigate to your desired directory and run:

```bash
npm create p5js
```

You will be prompted to provide the following information:

- **Project Name**: The name of your project directory.
- **p5.js Version**: Specify the version of p5.js to use (defaults to the latest stable release).
- **Delivery Mode**: Choose between local (download p5.js files) or CDN mode (link to p5.js using jsdelivr).
- **Template**: Choose from available templates (e.g., basic, instance, typescript).

### Simplified Setup

You can bypass the interactive prompts by providing command-line options:

```bash
npm create p5js -- --yes
```

This will use default values for all options (project name: `my-sketch`, template: `basic`, version: `latest`).

### Custom Parameters

You can also create a project non-interactively by providing command-line options:

```bash
npm create p5js my-project-name -- --template typescript --version 2.1.0
```

This command creates a new p5.js project named `my-project-name` using the TypeScript template and p5.js version 2.1.0.

This may be useful for scripting or integrating create-p5js into other workflows.

### Updating Existing Projects

To update an existing p5.js project created with `create-p5js`, navigate to the project directory and run:

```bash
npx create-p5js update
```

This command will let you update the p5.js version and/or mode, applying them to your project while preserving your custom sketch code.

>[!NOTE]
>The `update` command only works for projects originally created with `create-p5js` (i.e., those containing a `p5-config.json` file).

### Using Remote Starter Templates

You can also specify a remote Git repository as a starter template by using the `--template` option with a URL.

For example:

```bash
npm create p5js -- --template https://github.com/nbogie/p5-v2-ts-global-mode-starter.git
```

## Development

### Local Development Setup

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

## Acknowledgements
This project builds upon the work of the p5.js community. Thanks to all contributors and maintainers of p5.js. Thanks also to @nbogie and @davepagurek for their suggestions and feedback.

## Warnings
- This tool is provided "as is" without warranty of any kind. Use it at your own risk, and always back up your projects before applying updates.
- The create-p5 project is not an official p5.js or Processing Foundation release, though it aims to support and enhance the p5.js ecosystem.

## License
This project is licensed under the [LGPL-2.1 License](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html), with the exception of the code templates (see below). Read the [LICENSE](LICENSE) file for details.

The code templates provided in this repository are released under the Creative Commons CC0 1.0 Universal ([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)) Public Domain Dedication. They can be freely used, modified, and distributed without restriction.

## Generative Code Disclosure
Large portions of this project were generated with the assistance of generative coding tools (mainly Claude Code). While efforts have been made to ensure accuracy and quality, users should independently verify any LLM-generated content.
