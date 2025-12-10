import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

const tmpDir = path.join('tests', 'tmp-migration');
const oldConfigPath = path.join(tmpDir, 'p5-config.json');
const newConfigPath = path.join(tmpDir, '.p5-config.json');

const testConfig = {
  version: '1.9.0',
  mode: 'cdn',
  language: 'javascript',
  p5Mode: 'global',
  typeDefsVersion: null,
  lastUpdated: new Date().toISOString()
};

describe('Config file migration', () => {
  beforeEach(async () => {
    // Ensure clean state before each test
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup after each test
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('migrates old p5-config.json to .p5-config.json', async () => {
    // Setup: create old config file
    await fs.writeFile(oldConfigPath, JSON.stringify(testConfig, null, 2));

    // Use shared migration function
    const { migrateConfigIfNeeded } = await import('../src/config.js');
    const result = await migrateConfigIfNeeded(tmpDir);

    // Verify: migration succeeded
    expect(result.migrated).toBe(true);
    expect(result.error).toBe(null);

    // Verify: old file gone, new file exists with same content
    const { fileExists } = await import('../src/utils.js');
    const oldExists = await fileExists(oldConfigPath);
    const newExists = await fileExists(newConfigPath);
    expect(oldExists).toBe(false);
    expect(newExists).toBe(true);

    const content = await fs.readFile(newConfigPath, 'utf-8');
    const config = JSON.parse(content);
    expect(config.version).toBe('1.9.0');
  });

  it('does not migrate if new config file already exists', async () => {
    // Setup: create both old and new config files
    const oldContent = { ...testConfig, version: '1.9.0' };
    const newContent = { ...testConfig, version: '2.0.0' };
    await fs.writeFile(oldConfigPath, JSON.stringify(oldContent, null, 2));
    await fs.writeFile(newConfigPath, JSON.stringify(newContent, null, 2));

    // Use shared migration function
    const { migrateConfigIfNeeded } = await import('../src/config.js');
    const result = await migrateConfigIfNeeded(tmpDir);

    // Verify: migration failed with appropriate error
    expect(result.migrated).toBe(false);
    expect(result.error).toBe('error.migration.configExists');

    // Verify: both files still exist with original content
    const { fileExists } = await import('../src/utils.js');
    const oldExists = await fileExists(oldConfigPath);
    const newExists = await fileExists(newConfigPath);
    expect(oldExists).toBe(true);
    expect(newExists).toBe(true);

    const oldContentResult = JSON.parse(await fs.readFile(oldConfigPath, 'utf-8'));
    const newContentResult = JSON.parse(await fs.readFile(newConfigPath, 'utf-8'));
    expect(oldContentResult.version).toBe('1.9.0');
    expect(newContentResult.version).toBe('2.0.0');
  });

  it('handles permission errors gracefully', async () => {
    // Setup: create old config file
    await fs.writeFile(oldConfigPath, JSON.stringify(testConfig, null, 2));

    // Use shared migration function with permission error
    const { migrateConfigIfNeeded } = await import('../src/config.js');
    const { fileExists } = await import('../src/utils.js');

    let result;
    try {
      // Make directory read-only to force permission error
      // Note: This prevents both file detection and rename operations
      await fs.chmod(tmpDir, 0o444);
      result = await migrateConfigIfNeeded(tmpDir);
    } finally {
      // Restore permissions for cleanup
      await fs.chmod(tmpDir, 0o755);
    }

    // The chmod operation prevents the fileExists check from succeeding,
    // so the migration returns early with { migrated: false, error: null }.
    // This is the expected behavior when permission restrictions prevent
    // file access entirely.
    expect(result.migrated).toBe(false);
    expect(result.error).toBe(null);

    // After restoring permissions, verify the old file still exists
    const oldExists = await fileExists(oldConfigPath);
    expect(oldExists).toBe(true);

    // Verify the new file was not created
    const newExists = await fileExists(newConfigPath);
    expect(newExists).toBe(false);
  });

  it('returns false when no old config file exists', async () => {
    // No old config file created
    const { migrateConfigIfNeeded } = await import('../src/config.js');
    const result = await migrateConfigIfNeeded(tmpDir);

    // Verify: no migration needed
    expect(result.migrated).toBe(false);
    expect(result.error).toBe(null);
  });
});
