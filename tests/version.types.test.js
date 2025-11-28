import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { downloadTypeDefinitions } from '../src/version.js';

let originalFetch;
const tmpDir = path.join('tests', 'tmp-types');

beforeEach(async () => {
  originalFetch = globalThis.fetch;
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('downloadTypeDefinitions fallback', () => {
  it('falls back to latest when exact version not available', async () => {
    // Mock sequence: first call for exact version -> not ok
    // then fetchVersions (called inside) -> returns latest '1.9.0'
    // then fetch for latest types -> ok with content
    let call = 0;
    globalThis.fetch = async (url) => {
      call++;
      if (call === 1) {
        // exact version fetch -> 404
        return { ok: false, status: 404 };
      }

      if (url.includes('/v1/package/npm/p5')) {
        return {
          ok: true,
          json: async () => ({ tags: { latest: '1.9.0' }, versions: ['1.9.0', '1.8.0'] })
        };
      }

      // latest type fetch -> ok
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('0.0.1', tmpDir);
    expect(actual).toBe('1.9.0');

    const fileExists = await fs.stat(path.join(tmpDir, 'global.d.ts'))
      .then(() => true)
      .catch(() => false);

    expect(fileExists).toBe(true);
  });
});
