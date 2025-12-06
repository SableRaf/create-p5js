import { describe, it, expect } from 'vitest';
import { validateProjectName, validateProjectPath, isRemoteTemplateSpec, validateMode, validateVersion, validateLanguage, validateP5Mode, getTemplateName } from '../src/utils.js';

describe('utils validations', () => {
  it('validateProjectName rejects empty and invalid names', () => {
    expect(validateProjectName('')).toBeTruthy();
    expect(validateProjectName('my project')).toBeTruthy();
    expect(validateProjectName('.hidden')).toBeTruthy();
    expect(validateProjectName('good-name')).toBeNull();
  });

  it('validateProjectName handles numeric inputs', () => {
    // Numeric inputs should be converted to strings and validated
    expect(validateProjectName(1234)).toBeNull(); // Valid: "1234"
    expect(validateProjectName(42)).toBeNull(); // Valid: "42"
    expect(validateProjectName(0)).toBeNull(); // Valid: "0" is a valid name
  });

  it('validateProjectPath handles numeric inputs', () => {
    // Numeric inputs should be converted to strings and validated
    expect(validateProjectPath(1234)).toBeNull(); // Valid: "1234" is a relative path
    expect(validateProjectPath(42)).toBeNull(); // Valid: "42" is a relative path
  });

  it('isRemoteTemplateSpec detects remote templates', () => {
    // Remote templates (GitHub repos)
    expect(isRemoteTemplateSpec('user/repo')).toBe(true);
    expect(isRemoteTemplateSpec('https://github.com/user/repo.git')).toBe(true);

    // Not remote templates
    expect(isRemoteTemplateSpec('basic')).toBe(false);
    expect(isRemoteTemplateSpec('typescript')).toBe(false);
  });

  it('validateLanguage accepts javascript and typescript', () => {
    expect(validateLanguage('javascript')).toBeNull();
    expect(validateLanguage('typescript')).toBeNull();
    expect(validateLanguage('python')).toMatch(/Invalid language/);
  });

  it('validateP5Mode accepts global and instance', () => {
    expect(validateP5Mode('global')).toBeNull();
    expect(validateP5Mode('instance')).toBeNull();
    expect(validateP5Mode('custom')).toMatch(/Invalid mode/);
  });

  it('getTemplateName creates correct template directory names', () => {
    expect(getTemplateName('javascript', 'global')).toBe('basic-global-js');
    expect(getTemplateName('javascript', 'instance')).toBe('basic-instance-js');
    expect(getTemplateName('typescript', 'global')).toBe('basic-global-ts');
    expect(getTemplateName('typescript', 'instance')).toBe('basic-instance-ts');
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
