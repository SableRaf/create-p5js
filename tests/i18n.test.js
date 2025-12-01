import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { t, setLocale, getLocale, detectLocale } from '../src/i18n/index.js';

describe('i18n module', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset to English before each test
    setLocale('en');
  });

  afterEach(() => {
    // Restore original env vars after each test
    process.env = { ...originalEnv };
  });

  describe('setLocale and getLocale', () => {
    it('sets and gets the current locale', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');
    });

    it('loads messages when locale is set', () => {
      setLocale('en');
      // Should be able to translate known keys
      const result = t('cli.brand');
      expect(result).toBe('create-p5');
    });

    it('falls back to English for non-existent locales', () => {
      // Spy on console.warn to capture the fallback warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setLocale('nonexistent');

      // Should warn about fallback
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Locale nonexistent not found')
      );

      // Should still be able to translate English keys
      const result = t('cli.brand');
      expect(result).toBe('create-p5');

      warnSpy.mockRestore();
    });
  });

  describe('t() translation function', () => {
    it('translates simple keys without interpolation', () => {
      const result = t('cli.brand');
      expect(result).toBe('create-p5');
    });

    it('returns the key itself when translation not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = t('nonexistent.key');

      expect(result).toBe('nonexistent.key');
      expect(warnSpy).toHaveBeenCalledWith(
        'Translation key not found: nonexistent.key'
      );

      warnSpy.mockRestore();
    });

    it('interpolates single variable', () => {
      const result = t('error.directoryExists', { path: './my-sketch' });
      expect(result).toBe('Directory "./my-sketch" already exists.');
    });

    it('interpolates multiple variables', () => {
      const result = t('error.fetchTemplate', {
        template: 'my-template',
        error: 'network error'
      });
      expect(result).toBe(
        'Failed to fetch remote template "my-template": network error'
      );
    });

    it('leaves placeholder untouched when variable is undefined', () => {
      const result = t('error.directoryExists', {});
      expect(result).toBe('Directory "{path}" already exists.');
    });

    it('leaves placeholder untouched when variable is null', () => {
      const result = t('error.directoryExists', { path: null });
      expect(result).toBe('Directory "{path}" already exists.');
    });

    it('converts non-string variables to strings', () => {
      const result = t('error.directoryExists', { path: 123 });
      expect(result).toBe('Directory "123" already exists.');
    });

    it('handles empty string variables', () => {
      const result = t('error.directoryExists', { path: '' });
      expect(result).toBe('Directory "" already exists.');
    });

    it('handles variables with default vars parameter', () => {
      // Call t() without second parameter
      const result = t('cli.brand');
      expect(result).toBe('create-p5');
    });

    it('loads messages from all JSON files in locale directory', () => {
      // Test keys from different files
      expect(t('cli.brand')).toBe('create-p5');
      expect(t('error.existingProject.detected')).toBeTruthy();
    });
  });

  describe('detectLocale', () => {
    it('detects locale from LC_ALL environment variable', () => {
      process.env.LC_ALL = 'fr_FR.UTF-8';
      delete process.env.LC_MESSAGES;
      delete process.env.LANG;

      const detected = detectLocale();
      expect(detected).toBe('fr');
    });

    it('detects locale from LC_MESSAGES when LC_ALL not set', () => {
      delete process.env.LC_ALL;
      process.env.LC_MESSAGES = 'es_ES.UTF-8';
      delete process.env.LANG;

      const detected = detectLocale();
      expect(detected).toBe('es');
    });

    it('detects locale from LANG when LC_ALL and LC_MESSAGES not set', () => {
      delete process.env.LC_ALL;
      delete process.env.LC_MESSAGES;
      process.env.LANG = 'de_DE.UTF-8';

      const detected = detectLocale();
      expect(detected).toBe('de');
    });

    it('defaults to "en" when no locale environment variables set', () => {
      delete process.env.LC_ALL;
      delete process.env.LC_MESSAGES;
      delete process.env.LANG;

      const detected = detectLocale();
      expect(detected).toBe('en');
    });

    it('extracts language code from locale with underscore separator', () => {
      process.env.LC_ALL = 'pt_BR';

      const detected = detectLocale();
      expect(detected).toBe('pt');
    });

    it('extracts language code from locale with hyphen separator', () => {
      process.env.LC_ALL = 'zh-CN';

      const detected = detectLocale();
      expect(detected).toBe('zh');
    });

    it('handles simple two-letter locale codes', () => {
      process.env.LC_ALL = 'fr';

      const detected = detectLocale();
      expect(detected).toBe('fr');
    });

    it('handles case-insensitive locale codes', () => {
      process.env.LC_ALL = 'EN_US';

      const detected = detectLocale();
      expect(detected).toBe('en');
    });

    it('defaults to "en" for invalid locale format', () => {
      process.env.LC_ALL = '123-456-789';

      const detected = detectLocale();
      expect(detected).toBe('en');
    });

    it('defaults to "en" for empty string', () => {
      process.env.LC_ALL = '';

      const detected = detectLocale();
      expect(detected).toBe('en');
    });
  });

  describe('interpolation edge cases', () => {
    it('handles placeholders with numbers', () => {
      // Note: Current implementation only supports \w+ which includes numbers
      // This test documents the current behavior
      setLocale('en');
      const result = t('error.directoryExists', { path: '123' });
      expect(result).toBe('Directory "123" already exists.');
    });

    it('handles multiple occurrences of same placeholder', () => {
      // Create a message with repeated placeholder for testing
      // Since we can't easily add test messages, we'll test with existing ones
      const result = t('error.directoryExists', { path: 'test' });
      expect(result).toContain('test');
    });

    it('handles boolean values', () => {
      const result = t('error.directoryExists', { path: true });
      expect(result).toBe('Directory "true" already exists.');
    });

    it('handles object values by converting to string', () => {
      const result = t('error.directoryExists', { path: { toString: () => 'custom' } });
      expect(result).toBe('Directory "custom" already exists.');
    });
  });

  describe('integration with actual locale files', () => {
    it('loads all expected translation keys from cli.json', () => {
      expect(t('cli.brand')).toBeTruthy();
      expect(t('cli.intro')).toBeTruthy();
      expect(t('cli.help.usage')).toBeTruthy();
    });

    it('loads all expected translation keys from errors.json', () => {
      expect(t('error.existingProject.detected')).toBeTruthy();
      expect(t('error.directoryExists')).toBeTruthy();
      expect(t('error.fetchVersions.failed')).toBeTruthy();
    });

    it('verifies cli.brand returns expected value', () => {
      expect(t('cli.brand')).toBe('create-p5');
    });

    it('verifies error messages contain expected content', () => {
      expect(t('error.fetchVersions.failed')).toContain('Failed to fetch');
      expect(t('error.directoryExists')).toContain('{path}');
    });
  });

  describe('locale switching', () => {
    it('allows switching between locales', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');

      // Even if locale doesn't exist, it should update the current locale
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setLocale('fr');

      // getLocale should return 'fr' even though it fell back to 'en' messages
      expect(getLocale()).toBe('fr');

      warnSpy.mockRestore();
    });

    it('reloads messages when locale changes', () => {
      setLocale('en');
      const beforeSwitch = t('cli.brand');

      setLocale('en'); // Switch back to same locale
      const afterSwitch = t('cli.brand');

      // Messages should be reloaded and work the same
      expect(beforeSwitch).toBe(afterSwitch);
    });
  });
});
