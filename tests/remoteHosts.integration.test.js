import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchTemplate } from '../src/templateFetcher.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Integration tests for fetching templates from real remote hosts.
 * These tests verify that single-file templates work correctly for GitHub and Codeberg,
 * and that unsupported non-GitHub hosts fail gracefully without mangling URLs.
 */

describe('Remote hosts integration tests', () => {
  let testDir;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = path.join(os.tmpdir(), `create-p5-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up the test directory
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('GitHub single files', () => {
    it('should fetch a single markdown file from GitHub', async () => {
      const targetPath = path.join(testDir, 'github-md');

      // Use a stable GitHub file that's unlikely to be deleted
      await fetchTemplate('https://github.com/processing/p5.js/blob/main/README.md', targetPath);

      // Verify the directory was created
      const stats = await fs.stat(targetPath);
      expect(stats.isDirectory()).toBe(true);

      // Verify the file exists
      const fileExists = await fs.access(path.join(targetPath, 'README.md'))
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    }, 30000); // 30 second timeout for network request

    it('should fetch a single JavaScript file from GitHub', async () => {
      const targetPath = path.join(testDir, 'github-js');

      // Use a stable GitHub file
      await fetchTemplate('https://github.com/processing/p5.js/blob/main/src/core/constants.js', targetPath);

      // Verify the directory was created
      const stats = await fs.stat(targetPath);
      expect(stats.isDirectory()).toBe(true);

      // Verify the file exists
      const fileExists = await fs.access(path.join(targetPath, 'constants.js'))
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    }, 30000);

  });

  describe('Codeberg support', () => {
    it('should fetch a single file from Codeberg', async () => {
      const targetPath = path.join(testDir, 'codeberg-single-file');

      // Codeberg is now supported via fallback
      await fetchTemplate('https://codeberg.org/Codeberg/pages-server/src/branch/main/README.md', targetPath);

      // Verify the directory was created
      const stats = await fs.stat(targetPath);
      expect(stats.isDirectory()).toBe(true);

      // Verify the file exists
      const fileExists = await fs.access(path.join(targetPath, 'README.md'))
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    }, 30000);

    it('should fetch a full repository from Codeberg', async () => {
      const targetPath = path.join(testDir, 'codeberg-full-repo');

      // Fetch a small test repository
      await fetchTemplate('https://codeberg.org/blazp/p5js_template', targetPath);

      // Verify the directory was created
      const stats = await fs.stat(targetPath);
      expect(stats.isDirectory()).toBe(true);

      // Verify some expected files exist
      const readmeExists = await fs.access(path.join(targetPath, 'README.md'))
        .then(() => true)
        .catch(() => false);
      expect(readmeExists).toBe(true);
    }, 30000);
  });

  describe('Unsupported hosts error handling', () => {
    it('should not mangle GitLab URLs with GitHub fallback', async () => {
      const targetPath = path.join(testDir, 'gitlab-test');

      // This will fail but should NOT produce a mangled GitHub URL
      await expect(
        fetchTemplate('https://gitlab.com/hyaenatechnologies/http-proxy/-/blob/main/CHANGELOG.md', targetPath)
      ).rejects.toThrow();

      // The error should NOT contain raw.githubusercontent.com
      try {
        await fetchTemplate('https://gitlab.com/hyaenatechnologies/http-proxy/-/blob/main/CHANGELOG.md', targetPath);
      } catch (error) {
        expect(error.message).not.toContain('raw.githubusercontent.com');
        expect(error.message).not.toContain('https:/gitlab.com');
      }
    }, 30000);

    it('should not mangle Bitbucket URLs with GitHub fallback', async () => {
      const targetPath = path.join(testDir, 'bitbucket-test');

      // This will fail but should NOT produce a mangled GitHub URL
      try {
        await fetchTemplate('https://bitbucket.org/kleinstein/projects/src/master/Lu2020_JEM/README.md', targetPath);
      } catch (error) {
        expect(error.message).not.toContain('raw.githubusercontent.com');
        expect(error.message).not.toContain('https:/bitbucket.org');
      }
    }, 30000);
  });
});
