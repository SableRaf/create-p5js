# p5.js v2.x TypeScript project

## Prerequisites

-   [Node.js](https://nodejs.org/)

## Getting Started

### Install and run

To install dependencies and start vite dev server

```bash
npm i
npm run dev
```

### Choose global-mode or instance-mode p5.js

Two sketches are provided in src, one for each mode.

If you're not sure, use global mode.

Delete whichever of the two you don't need - this is important for correct type-checking operation.

Ensure index.html is pointing at the right one.

### (optional) Type-check ALL your files

You can type-check _all_ your files from the command-line, with:

```bash
npm run type-check
```
or continually with:

```bash
npm run type-check --watch
```

**In-editor** type-checking:

If you're using the editor VSCode, it will automatically type-check the files you _currently have open_ and present the errors in the vscode "problems" window.

If you're using VSCode, you can also use the keyboard short-cut `ctrl-shift-b` (windows) or `cmd-shift-b` (mac) to type-check **all** files and populate the vscode "problems" window with a list of any errors.

(For the curious, this is configured in `.vscode/tasks.json` to call `npm run type-check` behind the scenes.)