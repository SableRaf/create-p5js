# create-p5
create-p5 is a scaffolding tool that enables users to quickly create and manage p5.js projects using the `npm create` convention. It provides both interactive and non-interactive modes for project creation, along with utilities to update existing projects safely.

## Testing

Unit tests are provided using Vitest. To run the test suite locally:

```bash
pwsh.exe -Command "npm install"
pwsh.exe -Command "npm test"
```

The tests include basic coverage for version fetching (mocked), HTML template injection, and configuration file read/write. Add more tests under the `tests/` directory as the codebase evolves.
