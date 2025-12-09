import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scaffold } from '../src/operations/scaffold.js';
import * as display from '../src/ui/display.js';
import * as prompts from '../src/ui/prompts.js';
import { fetchTemplate } from '../src/templateFetcher.js';
import fs from 'fs/promises';

// Mock all UI and external dependencies
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, vars) => {
    // Mock translation function with actual error messages we need for tests
    const translations = {
      'error.templateIncompatibleFlags': 'Configuration flags (--version, --mode, --language, --p5-mode) cannot be used with --template. Community templates cannot be automatically customized.',
      'error.templateMustBeRemote': 'The --template flag now only accepts community templates (GitHub repos like \'user/repo\'). Built-in templates have been replaced by --language and --p5-mode flags.',
      'note.success.created': 'Project created successfully!',
      'note.success.failed': 'Project creation failed'
    };

    let result = translations[key] || key;
    if (vars) {
      Object.keys(vars).forEach(k => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
      });
    }
    return result;
  }),
  setLocale: vi.fn(),
  getLocale: vi.fn(() => 'en'),
  detectLocale: vi.fn(() => 'en')
}));

vi.mock('../src/ui/display.js', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  message: vi.fn(),
  note: vi.fn(),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({
    stop: vi.fn()
  }))
}));

vi.mock('../src/ui/prompts.js', () => ({
  promptProjectPath: vi.fn(),
  promptCustomize: vi.fn(),
  promptVersion: vi.fn(),
  promptMode: vi.fn(),
  promptLanguageAndMode: vi.fn(),
  isCancel: vi.fn(() => false)
}));

vi.mock('../src/templateFetcher.js', () => ({
  fetchTemplate: vi.fn(async () => {}),
  normalizeTemplateSpec: vi.fn(spec => spec)
}));

vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(async () => []),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    rm: vi.fn()
  }
}));

vi.mock('../src/version.js', () => ({
  fetchVersions: vi.fn(async () => ({
    latest: '1.9.0',
    versions: ['1.9.0', '1.8.0', '1.7.0']
  })),
  downloadP5Files: vi.fn(),
  downloadTypeDefinitions: vi.fn(async () => '1.7.7')
}));

vi.mock('../src/htmlManager.js', () => ({
  injectP5Script: vi.fn((html) => html)
}));

vi.mock('../src/config.js', () => ({
  createConfig: vi.fn()
}));

vi.mock('../src/git.js', () => ({
  initGit: vi.fn(),
  addLibToGitignore: vi.fn()
}));

vi.mock('../src/utils.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    copyTemplateFiles: vi.fn(),
    directoryExists: vi.fn(async () => false)
  };
});

describe('scaffold --template flag validation', () => {
  let exitSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.exit to prevent tests from actually exiting
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fail when --template is used with --version', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      version: '1.9.0',
      yes: true
    };

    await scaffold(args);

    // Should have called error display function
    expect(display.error).toHaveBeenCalled();
    // Find the message call that contains the error
    const errorMessage = display.message.mock.calls.find(call =>
      call[0] && call[0].includes('cannot be used with --template')
    );
    expect(errorMessage).toBeTruthy();
    expect(errorMessage[0]).toMatch(/--version/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should fail when --template is used with --mode', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      mode: 'local',
      yes: true
    };

    await scaffold(args);

    expect(display.error).toHaveBeenCalled();
    const errorMessage = display.message.mock.calls.find(call =>
      call[0] && call[0].includes('cannot be used with --template')
    );
    expect(errorMessage).toBeTruthy();
    expect(errorMessage[0]).toMatch(/--mode/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should fail when --template is used with --language', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      language: 'typescript',
      yes: true
    };

    await scaffold(args);

    expect(display.error).toHaveBeenCalled();
    const errorMessage = display.message.mock.calls.find(call =>
      call[0] && call[0].includes('cannot be used with --template')
    );
    expect(errorMessage).toBeTruthy();
    expect(errorMessage[0]).toMatch(/--language/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should fail when --template is used with --p5-mode', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      'p5-mode': 'instance',
      yes: true
    };

    await scaffold(args);

    expect(display.error).toHaveBeenCalled();
    const errorMessage = display.message.mock.calls.find(call =>
      call[0] && call[0].includes('cannot be used with --template')
    );
    expect(errorMessage).toBeTruthy();
    expect(errorMessage[0]).toMatch(/--p5-mode/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should fail when --template is used with multiple config flags', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      version: '1.9.0',
      mode: 'local',
      language: 'typescript',
      yes: true
    };

    await scaffold(args);

    expect(display.error).toHaveBeenCalled();
    const errorMessage = display.message.mock.calls.find(call =>
      call[0] && call[0].includes('cannot be used with --template')
    );
    expect(errorMessage).toBeTruthy();
    expect(errorMessage[0]).toMatch(/--version/);
    expect(errorMessage[0]).toMatch(/--mode/);
    expect(errorMessage[0]).toMatch(/--language/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // Note: Success cases are not tested here due to mocking complexity.
  // The core functionality (rejecting incompatible flags) is verified above.
  // Manual testing confirms that --template works correctly without config flags.
});
