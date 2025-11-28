import { describe, it, expect } from 'vitest';
import { validateProjectName, validateTemplate, validateMode, validateVersion } from '../src/utils.js';

describe('utils validations', () => {
  it('validateProjectName rejects empty and invalid names', () => {
    expect(validateProjectName('')).toBeTruthy();
    expect(validateProjectName('my project')).toBeTruthy();
    expect(validateProjectName('.hidden')).toBeTruthy();
    expect(validateProjectName('good-name')).toBeNull();
  });

  it('validateTemplate accepts known templates', () => {
    expect(validateTemplate('basic')).toBeNull();
    expect(validateTemplate('unknown')).toMatch(/Invalid template/);
  });

  it('validateMode accepts cdn and local', () => {
    expect(validateMode('cdn')).toBeNull();
    expect(validateMode('local')).toBeNull();
    expect(validateMode('remote')).toMatch(/Invalid mode/);
  });

  it('validateVersion handles latest and available list', () => {
    const available = ['1.9.0', '1.8.0'];
    expect(validateVersion('latest', available, '1.9.0')).toBeNull();
    expect(validateVersion('1.9.0', available, '1.9.0')).toBeNull();
    expect(validateVersion('2.0.0', available, '1.9.0')).toMatch(/not found/);
  });
});
