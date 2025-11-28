import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { downloadP5Files } from '../src/version.js';

let originalFetch;
const tmpDir = path.join('tests', 'tmp-download');

beforeEach(async () => {
  originalFetch = globalThis.fetch;
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('downloadP5Files', () => {
  it('downloads p5.js and p5.min.js into target dir', async () => {
    globalThis.fetch = async (url) => ({
      ok: true,
      text: async () => `// content for ${url}`
    });

    await downloadP5Files('1.9.0', tmpDir);

    const a = await fs.readFile(path.join(tmpDir, 'p5.js'), 'utf-8');
    const b = await fs.readFile(path.join(tmpDir, 'p5.min.js'), 'utf-8');

    expect(a).toMatch(/p5@1.9.0/);
    expect(b).toMatch(/p5@1.9.0/);
  });
});
