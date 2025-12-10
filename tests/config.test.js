import { describe, it, expect } from 'vitest';
import { createConfig, readConfig } from '../src/config.js';
import fs from 'fs/promises';
import path from 'path';

const tmpDir = path.join('tests', 'tmp-config');
const configPath = path.join(tmpDir, '.p5-config.json');

describe('ConfigManager', () => {
  it('creates and reads .p5-config.json', async () => {
    await fs.mkdir(tmpDir, { recursive: true });

    await createConfig(configPath, {
      version: '1.9.0',
      mode: 'cdn',
      template: 'basic',
      typeDefsVersion: null
    });

    const cfg = await readConfig(configPath);
    expect(cfg).not.toBeNull();
    expect(cfg.version).toBe('1.9.0');
    expect(cfg.mode).toBe('cdn');

    // cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
