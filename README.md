>[!IMPORTANT]
>This project is a work in progress. While it is functional, some features may not be fully implemented or stable, and the documentation may be incomplete or inaccurate. API and functionality may change without notice. Use at your own discretion and feel free to contribute!

# create-p5
create-p5 is a scaffolding tool that enables users to quickly create and manage p5.js projects using the `npm create` convention. It provides both interactive and non-interactive modes for project creation, along with utilities to update existing projects safely.

![create-p5 CLI Demo](images/create-p5-CLI-demo.gif)

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Git](https://git-scm.com/)

### Installation

Clone the repository:

```bash
git clone https://github.com/your-username/create-p5.git
cd create-p5
npm install
npm link
```

This will create a global symlink for the `create-p5` command, allowing you to use it via `npx create-p5`.

### Uninstallation

To uninstall the local link, run `npm unlink -g create-p5`.

## Usage

### Interactive Mode
To create a new p5.js project, navigate to your desired directory and run:

```bash
npx create-p5
```

You will be prompted to provide the following information:

- **Project Name**: The name of your project directory.
- **Template**: Choose from available templates (e.g., basic, instance, typescript).
- **p5.js Version**: Specify the version of p5.js to use (defaults to the latest stable release).

### Simplified Setup

You can bypass the interactive prompts by providing command-line options:

```bash
npx create-p5 --yes
```

This will use default values for all options (project name: `my-sketch`, template: `basic`, version: `latest`).

### Custom Parameters

You can also create a project non-interactively by providing command-line options:

```bash
npx create-p5 my-project-name --template typescript --version 2.1.0
```

This command creates a new p5.js project named `my-project-name` using the TypeScript template and p5.js version 2.1.0.

This may be useful for scripting or integrating create-p5 into other workflows.

### Updating Existing Projects

To update an existing p5.js project created with `create-p5`, navigate to the project directory and run:

```bash
npx create-p5 update
```

This command will let you update the p5.js version and/or mode, applying them to your project while preserving your custom sketch code.

>[!NOTE]
>The `update` command only work for projects originally created with `create-p5` (i.e., those containing a `p5-config.json` file).

### Using Remote Starter Templates

You can also specify a remote Git repository as a starter template by using the `--template` option with a URL. 

For example:

```bash
npx create-p5 --template https://github.com/nbogie/p5-v2-ts-global-mode-starter.git
```

## Testing

Unit tests are provided using Vitest. To run the test suite locally, clone the repository and execute:

```bash
npm install
npm test
```

The tests include basic coverage for version fetching (mocked), HTML template injection, and configuration file read/write. Add more tests under the `tests/` directory as the codebase evolves.

## Acknowledgements
This project builds upon the work of the p5.js community.  Thanks to all contributors and maintainers of p5.js. Thanks also to @nbogie and @davepagurek for their suggestions and feedback.

## Warnings
- This tool is provided "as is" without warranty of any kind. Use it at your own risk, and always back up your projects before applying updates.
- The create-p5 project is not an official p5.js or Processing Foundation release, though it aims to support and enhance the p5.js ecosystem.

## License
This project is licensed under the LGPL-2.1 License. See the [LICENSE](LICENSE) file for details.

## Generative Code Disclosure
Large portions of this project were generated with the assistance of generative coding tools (mainly Claude Code). While efforts have been made to ensure accuracy and quality, users should independently verify any LLM-generated content.