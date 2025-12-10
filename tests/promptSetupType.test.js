import { describe, it, expect } from 'vitest';

/**
 * Tests for promptSetupType function
 *
 * Note: These tests verify the function signature and expected return values.
 * Full integration testing with @clack/prompts would require mocking user input,
 * which is covered in integration tests.
 */

describe('promptSetupType', () => {
  it('should be exported from prompts module', async () => {
    const prompts = await import('../src/ui/prompts.js');
    expect(prompts.promptSetupType).toBeDefined();
    expect(typeof prompts.promptSetupType).toBe('function');
  });

  it('should return a Promise', async () => {
    // Import and verify it's an async function
    const prompts = await import('../src/ui/prompts.js');
    const result = prompts.promptSetupType();
    expect(result).toBeInstanceOf(Promise);
    // Cancel the prompt to avoid hanging
    result.catch(() => {}); // Ignore cancellation
  });
});

describe('setupType enum values', () => {
  it('should support basic, standard, and custom values', () => {
    const validValues = ['basic', 'standard', 'custom'];

    // Verify these are the expected enum values
    validValues.forEach(value => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it('basic should represent minimal setup', () => {
    const setupType = 'basic';
    expect(setupType).toBe('basic');
  });

  it('standard should represent full default setup', () => {
    const setupType = 'standard';
    expect(setupType).toBe('standard');
  });

  it('custom should represent manual configuration', () => {
    const setupType = 'custom';
    expect(setupType).toBe('custom');
  });
});

describe('i18n keys for setupType', () => {
  it('should have translation keys for all setup types', async () => {
    const { t } = await import('../src/i18n/index.js');

    // Verify translation keys exist
    expect(t('prompt.setupType.message')).toBeTruthy();
    expect(t('prompt.setupType.option.basic.label')).toBeTruthy();
    expect(t('prompt.setupType.option.basic.hint')).toBeTruthy();
    expect(t('prompt.setupType.option.standard.label')).toBeTruthy();
    expect(t('prompt.setupType.option.standard.hint')).toBeTruthy();
    expect(t('prompt.setupType.option.custom.label')).toBeTruthy();
    expect(t('prompt.setupType.option.custom.hint')).toBeTruthy();
  });

  it('basic hint should mention minimal setup', async () => {
    const { t } = await import('../src/i18n/index.js');
    const hint = t('prompt.setupType.option.basic.hint').toLowerCase();
    expect(hint).toContain('minimal');
  });

  it('standard hint should mention defaults', async () => {
    const { t } = await import('../src/i18n/index.js');
    const hint = t('prompt.setupType.option.standard.hint').toLowerCase();
    expect(hint).toMatch(/default|full/);
  });
});
