import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchVersions } from '../src/version.js';

let originalFetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchVersions', () => {
  it('returns latest and versions array from mocked API', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ tags: { latest: '1.9.0' }, versions: ['1.9.0', '1.8.1', '1.8.0'] })
    });

    const result = await fetchVersions();
    expect(result).toHaveProperty('latest', '1.9.0');
    expect(Array.isArray(result.versions)).toBe(true);
    expect(result.versions.length).toBeGreaterThan(0);
  });
});
