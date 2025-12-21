import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as prompts from '@clack/prompts';
import * as display from '../src/ui/display.js';
import { setLocale } from '../src/i18n/index.js';

const spinnerInstances = [];

vi.mock('@clack/prompts', () => {
  const log = {
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  };

  const spinner = vi.fn(() => {
    const instance = {
      start: vi.fn(),
      message: vi.fn(),
      stop: vi.fn()
    };
    instance.__messageMock = instance.message;
    instance.__stopMock = instance.stop;
    spinnerInstances.push(instance);
    return instance;
  });

  return {
    intro: vi.fn(),
    outro: vi.fn(),
    cancel: vi.fn(),
    note: vi.fn(),
    spinner,
    log
  };
});

describe('display silent mode behavior', () => {
  let exitSpy;

  beforeEach(() => {
    spinnerInstances.length = 0;
    vi.clearAllMocks();
    setLocale('en');
    display.setSilentMode(false);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('suppresses general UI output when silent mode is enabled', () => {
    display.setSilentMode(true);

    display.intro();
    display.message('plain');
    display.info('info.creatingIn', { path: './sketch' });
    display.success('note.success.created');
    display.note(
      ['note.projectSummary.name'],
      'note.projectSummary.title',
      { name: 'Sketch' }
    );

    expect(prompts.intro).not.toHaveBeenCalled();
    expect(prompts.log.message).not.toHaveBeenCalled();
    expect(prompts.log.info).not.toHaveBeenCalled();
    expect(prompts.log.success).not.toHaveBeenCalled();
    expect(prompts.note).not.toHaveBeenCalled();
  });

  it('prevents outro output but still exits when silent mode is enabled', () => {
    display.setSilentMode(true);

    display.outro('hidden message', 5);

    expect(prompts.outro).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(5);
  });

  it('prevents cancel output but still exits when silent mode is enabled', () => {
    display.setSilentMode(true);

    display.cancel('info.update.cancelled');

    expect(prompts.cancel).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('returns a noop spinner when silent mode is enabled', () => {
    display.setSilentMode(true);

    const silentSpinner = display.spinner('spinner.fetchingVersions');

    expect(prompts.spinner).not.toHaveBeenCalled();
    expect(typeof silentSpinner.message).toBe('function');
    expect(typeof silentSpinner.stop).toBe('function');
    expect(() =>
      silentSpinner.message('spinner.fetchedVersions')
    ).not.toThrow();
    expect(() => silentSpinner.stop('spinner.fetchedVersions')).not.toThrow();
  });

  it('always logs errors and warnings even in silent mode', () => {
    display.setSilentMode(true);

    display.error('error.directoryExists', { path: './sketch' });
    display.warn('info.update.cancelled');

    expect(prompts.log.error).toHaveBeenCalledWith(
      'Directory "./sketch" already exists.'
    );
    expect(prompts.log.warn).toHaveBeenCalledWith('Update cancelled.');
  });

  it('resumes normal logging when silent mode is disabled again', () => {
    display.setSilentMode(true);
    display.message('hidden');

    display.setSilentMode(false);
    display.message('visible');

    expect(prompts.log.message).toHaveBeenCalledTimes(1);
    expect(prompts.log.message).toHaveBeenCalledWith('visible');
  });

  it('displays outro output when silent mode is disabled', () => {
    display.outro('All done', 0);

    expect(prompts.outro).toHaveBeenCalledWith('All done');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('displays cancellation output when silent mode is disabled', () => {
    display.cancel('info.update.cancelled');

    expect(prompts.cancel).toHaveBeenCalledWith('Update cancelled.');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('creates a real spinner when silent mode is disabled', () => {
    const activeSpinner = display.spinner('spinner.fetchingVersions');

    expect(prompts.spinner).toHaveBeenCalledTimes(1);
    expect(spinnerInstances).toHaveLength(1);

    const instance = spinnerInstances[0];
    expect(instance.start).toHaveBeenCalledWith('Fetching p5.js versions');

    activeSpinner.message('spinner.fetchedVersions');
    expect(instance.__messageMock).toHaveBeenCalledWith(
      '✓ Fetched available p5.js versions'
    );

    activeSpinner.stop('spinner.copiedTemplate');
    expect(instance.__stopMock).toHaveBeenCalledWith(
      '✓ Copied template files'
    );
  });
});
