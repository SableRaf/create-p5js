import { describe, it, expect, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Mock child_process.spawn behavior for isGitInstalled
vi.mock('child_process', () => ({
  spawn: () => ({
    on: (event, cb) => {
      if (event === 'error') {
        // do nothing
      }
      if (event === 'close') {
        // simulate success
        setImmediate(() => cb(0));
      }
    }
  })
}));

import { isGitInstalled, addLibToGitignore } from '../src/git.js';

const tmpDir = path.join('tests', 'tmp-git');
const gitignorePath = path.join(tmpDir, '.gitignore');

describe('git helpers', () => {
  it('detects git installed (mocked spawn)', async () => {
    const res = await isGitInstalled();
    expect(res).toBe(true);
  });

  it('adds lib/ to .gitignore when missing', async () => {
    await fs.mkdir(tmpDir, { recursive: true });

    // ensure no .gitignore exists
    try { await fs.unlink(gitignorePath); } catch {}

    await addLibToGitignore(tmpDir);

    const content = await fs.readFile(gitignorePath, 'utf-8');
    expect(content).toMatch(/lib\//);

    // cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
