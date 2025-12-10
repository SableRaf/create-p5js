import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

describe('template structure', () => {
  const templatesDir = join(process.cwd(), 'templates');

  describe('minimal-global-js template', () => {
    const minimalTemplateDir = join(templatesDir, 'minimal-global-js');

    it('exists', () => {
      expect(existsSync(minimalTemplateDir)).toBe(true);
    });

    it('contains required files', async () => {
      const files = await readdir(minimalTemplateDir);
      expect(files).toContain('index.html');
      expect(files).toContain('style.css');
      expect(files).toContain('sketch.js');
    });

    it('does not contain jsconfig.json', async () => {
      const files = await readdir(minimalTemplateDir);
      expect(files).not.toContain('jsconfig.json');
    });

    it('contains exactly 3 files', async () => {
      const files = await readdir(minimalTemplateDir);
      expect(files.length).toBe(3);
    });
  });

  describe('basic-global-js template', () => {
    const basicTemplateDir = join(templatesDir, 'basic-global-js');

    it('exists', () => {
      expect(existsSync(basicTemplateDir)).toBe(true);
    });

    it('contains required files including jsconfig.json', async () => {
      const files = await readdir(basicTemplateDir);
      expect(files).toContain('index.html');
      expect(files).toContain('style.css');
      expect(files).toContain('sketch.js');
      expect(files).toContain('jsconfig.json');
    });
  });
});
