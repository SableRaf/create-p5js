import { describe, it, expect } from 'vitest';
import {
  determineTargetPath,
  validateProjectName,
  validateProjectPath,
  isRemoteTemplateSpec,
  validateMode,
  validateVersion,
  validateLanguage,
  validateP5Mode,
  getTemplateName,
  hasValidCharacters,
  hasValidEnding,
  isNotReservedName,
  hasValidLength,
  isValidPathName
} from '../src/utils.js';

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


describe(determineTargetPath.name, () => {
  it ("returns an absolute path unchanged if given one on *nix", () => {
      expect(determineTargetPath("/Users/mrtest/iworkhere", "/Users/mrtest/elsewhere/aaa")).toBe("/Users/mrtest/elsewhere/aaa");
      expect(determineTargetPath("/Users/mrtest/iworkhere", "/tmp/quickproject")).toBe("/tmp/quickproject");
  });
  
  it ("returns absolute path incorporating cwd if given a relative path on *nix", () => {
      expect(determineTargetPath("/Users/mrtest/stuff", "aaa/bbb")).toBe("/Users/mrtest/stuff/aaa/bbb");
      expect(determineTargetPath("/Users/mrtest/stuff", "ccc")).toBe("/Users/mrtest/stuff/ccc");

  });

  it ("returns absolute path to cwd when given '.' for project path on *nix", () => {
      expect(determineTargetPath("/Users/mrtest/iworkhere", ".")).toBe("/Users/mrtest/iworkhere");
  });

  it("handles Windows drive letters and separators", () => {
      // Absolute paths with drive letters
      expect(determineTargetPath("C:\\Users\\test", "D:\\Project")).toBe("D:\\Project");
      
      // Relative paths on Windows
      expect(determineTargetPath("C:\\Users\\test", "subdir1\\subdir2")).toBe("C:\\Users\\test\\subdir1\\subdir2");
      expect(determineTargetPath("C:\\Users\\test", "subdir")).toBe("C:\\Users\\test\\subdir");
  });

})

describe('path name validation functions', () => {
  describe('hasValidCharacters', () => {
    it('returns true for valid characters', () => {
      expect(hasValidCharacters('my-sketch')).toBe(true);
      expect(hasValidCharacters('sketch_2024')).toBe(true);
      expect(hasValidCharacters('My.Sketch.Name')).toBe(true);
      expect(hasValidCharacters('123')).toBe(true);
      expect(hasValidCharacters('test')).toBe(true);
    });

    it('returns false for invalid characters', () => {
      // Windows reserved characters
      expect(hasValidCharacters('my<sketch')).toBe(false);
      expect(hasValidCharacters('my>sketch')).toBe(false);
      expect(hasValidCharacters('my:sketch')).toBe(false);
      expect(hasValidCharacters('my"sketch')).toBe(false);
      expect(hasValidCharacters('my|sketch')).toBe(false);
      expect(hasValidCharacters('my?sketch')).toBe(false);
      expect(hasValidCharacters('my*sketch')).toBe(false);

      // Path separators
      expect(hasValidCharacters('my/sketch')).toBe(false);
      expect(hasValidCharacters('my\\sketch')).toBe(false);

      // Control characters (null, tab, etc.)
      expect(hasValidCharacters('my\x00sketch')).toBe(false);
      expect(hasValidCharacters('my\x1fsketch')).toBe(false);
    });
  });

  describe('hasValidEnding', () => {
    it('returns true for valid endings', () => {
      expect(hasValidEnding('my-sketch')).toBe(true);
      expect(hasValidEnding('sketch123')).toBe(true);
      expect(hasValidEnding('Test')).toBe(true);
    });

    it('returns false for invalid endings', () => {
      // Ending with space
      expect(hasValidEnding('my-sketch ')).toBe(false);
      expect(hasValidEnding('sketch  ')).toBe(false);

      // Ending with dot
      expect(hasValidEnding('my-sketch.')).toBe(false);
      expect(hasValidEnding('sketch..')).toBe(false);

      // Ending with tab or other whitespace
      expect(hasValidEnding('sketch\t')).toBe(false);
      expect(hasValidEnding('sketch\n')).toBe(false);
    });
  });

  describe('isNotReservedName', () => {
    it('returns true for non-reserved names', () => {
      expect(isNotReservedName('my-sketch')).toBe(true);
      expect(isNotReservedName('console')).toBe(true); // "console" is ok, "con" is reserved
      expect(isNotReservedName('printer')).toBe(true); // "printer" is ok, "prn" is reserved
      expect(isNotReservedName('com')).toBe(true); // "com" without number is ok
      expect(isNotReservedName('lpt')).toBe(true); // "lpt" without number is ok
    });

    it('returns false for reserved Windows names', () => {
      // Case insensitive
      expect(isNotReservedName('CON')).toBe(false);
      expect(isNotReservedName('con')).toBe(false);
      expect(isNotReservedName('Con')).toBe(false);

      // Other reserved names
      expect(isNotReservedName('PRN')).toBe(false);
      expect(isNotReservedName('AUX')).toBe(false);
      expect(isNotReservedName('NUL')).toBe(false);

      // COM ports 0-9
      expect(isNotReservedName('COM1')).toBe(false);
      expect(isNotReservedName('com5')).toBe(false);
      expect(isNotReservedName('COM9')).toBe(false);

      // LPT ports 0-9
      expect(isNotReservedName('LPT1')).toBe(false);
      expect(isNotReservedName('lpt3')).toBe(false);
      expect(isNotReservedName('LPT9')).toBe(false);

      // Reserved names with extensions
      expect(isNotReservedName('CON.txt')).toBe(false);
      expect(isNotReservedName('PRN.md')).toBe(false);
    });
  });

  describe('hasValidLength', () => {
    it('returns true for valid lengths', () => {
      expect(hasValidLength('a')).toBe(true);
      expect(hasValidLength('my-sketch')).toBe(true);
      expect(hasValidLength('a'.repeat(255))).toBe(true); // Exactly 255 chars
    });

    it('returns false for too long paths', () => {
      expect(hasValidLength('a'.repeat(256))).toBe(false); // 256 chars
      expect(hasValidLength('a'.repeat(1000))).toBe(false); // Way too long
    });
  });

  describe('isValidPathName', () => {
    it('returns null for valid path names', () => {
      expect(isValidPathName('my-sketch')).toBeNull();
      expect(isValidPathName('sketch_2024')).toBeNull();
      expect(isValidPathName('Test-Project')).toBeNull();
      expect(isValidPathName('123')).toBeNull();
      expect(isValidPathName('p5-animation')).toBeNull();
    });

    it('returns specific error key for invalid characters', () => {
      expect(isValidPathName('my<sketch')).toBe('prompt.projectPath.error.invalidChars');
      expect(isValidPathName('my:sketch')).toBe('prompt.projectPath.error.invalidChars');
      expect(isValidPathName('my/sketch')).toBe('prompt.projectPath.error.invalidChars');
      expect(isValidPathName('my\\sketch')).toBe('prompt.projectPath.error.invalidChars');
    });

    it('returns specific error key for invalid ending', () => {
      // Note: Spaces are trimmed first, so test with dot endings
      expect(isValidPathName('my-sketch.')).toBe('prompt.projectPath.error.invalidEnding');
      expect(isValidPathName('sketch..')).toBe('prompt.projectPath.error.invalidEnding');
      // To test trailing space, it needs to be in the middle of the trimmed string
      expect(isValidPathName('my-sketch. ')).toBe('prompt.projectPath.error.invalidEnding');
    });

    it('returns specific error key for reserved names', () => {
      expect(isValidPathName('CON')).toBe('prompt.projectPath.error.reservedName');
      expect(isValidPathName('prn')).toBe('prompt.projectPath.error.reservedName');
      expect(isValidPathName('COM1')).toBe('prompt.projectPath.error.reservedName');
      expect(isValidPathName('lpt5')).toBe('prompt.projectPath.error.reservedName');
    });

    it('returns specific error key for too long names', () => {
      expect(isValidPathName('a'.repeat(256))).toBe('prompt.projectPath.error.tooLong');
      expect(isValidPathName('a'.repeat(1000))).toBe('prompt.projectPath.error.tooLong');
    });

    it('handles whitespace correctly by trimming', () => {
      // Leading/trailing spaces are trimmed before validation
      expect(isValidPathName('  my-sketch  ')).toBeNull();
      expect(isValidPathName('\tmy-sketch\t')).toBeNull();
    });

    it('validates in correct order (characters -> ending -> reserved -> length)', () => {
      // Invalid characters should be caught first
      const longInvalidChars = 'a'.repeat(256) + '<';
      expect(isValidPathName(longInvalidChars)).toBe('prompt.projectPath.error.invalidChars');

      // Invalid ending should be caught before reserved name
      expect(isValidPathName('CON.')).toBe('prompt.projectPath.error.invalidEnding');

      // Length check happens last - so a long string is checked for length
      const veryLongName = 'a'.repeat(256);
      expect(isValidPathName(veryLongName)).toBe('prompt.projectPath.error.tooLong');
    });
  });
});
