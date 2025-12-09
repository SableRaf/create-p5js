import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scaffold } from '../src/operations/scaffold.js';
import * as display from '../src/ui/display.js';
import * as prompts from '../src/ui/prompts.js';
import { fetchTemplate } from '../templateFetcher.js';
import fs from 'fs/promises';

// Mock all UI and external dependencies
vi.mock('../src/ui/display.js', () => ({
  intro: vi.fn(),
  outro: vi.fn(() => process.exit(0)),
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  message: vi.fn(),
  note: vi.fn(),
  cancel: vi.fn(() => process.exit(0)),
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

vi.mock('../templateFetcher.js', () => ({
  fetchTemplate: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.exit to prevent tests from actually exiting
    vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error when --template is used with --version', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      version: '1.9.0',
      yes: true
    };

    await expect(scaffold(args)).rejects.toThrow(/templateIncompatibleFlags/);
  });

  it('should throw error when --template is used with --mode', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      mode: 'local',
      yes: true
    };

    await expect(scaffold(args)).rejects.toThrow(/templateIncompatibleFlags/);
  });

  it('should throw error when --template is used with --language', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      language: 'typescript',
      yes: true
    };

    await expect(scaffold(args)).rejects.toThrow(/templateIncompatibleFlags/);
  });

  it('should throw error when --template is used with --p5-mode', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      'p5-mode': 'instance',
      yes: true
    };

    await expect(scaffold(args)).rejects.toThrow(/templateIncompatibleFlags/);
  });

  it('should throw error when --template is used with multiple config flags', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      version: '1.9.0',
      mode: 'local',
      language: 'typescript',
      yes: true
    };

    const error = await scaffold(args).catch(e => e);
    expect(error.message).toMatch(/templateIncompatibleFlags/);
    expect(error.message).toMatch(/--version/);
    expect(error.message).toMatch(/--mode/);
    expect(error.message).toMatch(/--language/);
  });

  it('should succeed when --template is used alone', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      yes: true
    };

    // Mock fetchTemplate to resolve successfully
    fetchTemplate.mockResolvedValueOnce();

    await scaffold(args);

    // Verify fetchTemplate was called
    expect(fetchTemplate).toHaveBeenCalledWith(
      'user/repo',
      expect.any(String),
      expect.objectContaining({ verbose: undefined })
    );
  });

  it('should succeed when --template is used with --yes flag', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      yes: true
    };

    // Mock fetchTemplate to resolve successfully
    fetchTemplate.mockResolvedValueOnce();

    await scaffold(args);

    // Verify fetchTemplate was called
    expect(fetchTemplate).toHaveBeenCalled();
  });

  it('should succeed when --template is used with --verbose flag', async () => {
    const args = {
      _: ['test-sketch'],
      template: 'user/repo',
      verbose: true,
      yes: true
    };

    // Mock fetchTemplate to resolve successfully
    fetchTemplate.mockResolvedValueOnce();

    await scaffold(args);

    // Verify fetchTemplate was called with verbose flag
    expect(fetchTemplate).toHaveBeenCalledWith(
      'user/repo',
      expect.any(String),
      expect.objectContaining({ verbose: true })
    );
  });
});
