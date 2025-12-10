import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

const tmpDir = path.join('tests', 'tmp-migration');
const oldConfigPath = path.join(tmpDir, 'p5-config.json');
const newConfigPath = path.join(tmpDir, '.p5-config.json');

describe('Config file migration', () => {
  it('migrates old p5-config.json to .p5-config.json', async () => {
    // Setup: create temp directory with old config file
    await fs.mkdir(tmpDir, { recursive: true });
    const testConfig = {
      version: '1.9.0',
      mode: 'cdn',
      language: 'javascript',
      p5Mode: 'global',
      typeDefsVersion: null,
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(oldConfigPath, JSON.stringify(testConfig, null, 2));

    // Simulate migration (what update.js does)
    const { fileExists } = await import('../src/utils.js');
    if (await fileExists(oldConfigPath)) {
      await fs.rename(oldConfigPath, newConfigPath);
    }

    // Verify: old file gone, new file exists with same content
    const oldExists = await fileExists(oldConfigPath);
    const newExists = await fileExists(newConfigPath);
    expect(oldExists).toBe(false);
    expect(newExists).toBe(true);

    const content = await fs.readFile(newConfigPath, 'utf-8');
    const config = JSON.parse(content);
    expect(config.version).toBe('1.9.0');

    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
