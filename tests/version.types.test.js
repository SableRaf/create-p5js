import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { downloadTypeDefinitions, parseVersion, getTypesStrategy, findClosestVersion, findExactMinorMatch, fetchTypesVersions } from '../src/version.js';

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

describe('parseVersion', () => {
  it('parses stable versions correctly', () => {
    const result = parseVersion('1.9.0');
    expect(result).toEqual({ major: 1, minor: 9, patch: 0, prerelease: null });
  });

  it('parses prerelease versions correctly', () => {
    const result = parseVersion('2.1.0-rc.1');
    expect(result).toEqual({ major: 2, minor: 1, patch: 0, prerelease: 'rc.1' });
  });

  it('throws on invalid version strings', () => {
    expect(() => parseVersion('invalid')).toThrow('Invalid semver version');
  });
});

describe('findClosestVersion', () => {
  const availableVersions = ['1.3.0', '1.4.2', '1.4.3', '1.5.0', '1.7.6', '1.7.7'];

  it('finds exact major.minor match with highest patch', () => {
    const result = findClosestVersion('1.4.0', availableVersions);
    expect(result).toBe('1.4.3'); // Highest patch in 1.4.x
  });

  it('finds closest minor when exact match not available', () => {
    const result = findClosestVersion('1.6.0', availableVersions);
    // 1.6 not available, closest is 1.5 or 1.7, should pick 1.5 (first in sort)
    expect(['1.5.0', '1.7.7']).toContain(result);
  });

  it('returns null when no matching major version', () => {
    const result = findClosestVersion('2.0.0', availableVersions);
    expect(result).toBeNull();
  });

  it('handles single available version', () => {
    const result = findClosestVersion('1.4.0', ['1.7.7']);
    expect(result).toBe('1.7.7');
  });
});

describe('findExactMinorMatch', () => {
  const availableVersions = ['1.3.0', '1.4.2', '1.4.3', '1.5.0', '1.7.6', '1.7.7'];

  it('finds exact major.minor match with highest patch', () => {
    const result = findExactMinorMatch('1.4.0', availableVersions);
    expect(result).toBe('1.4.3'); // Highest patch in 1.4.x
  });

  it('returns null when no exact major.minor match exists', () => {
    const result = findExactMinorMatch('1.6.0', availableVersions);
    expect(result).toBeNull(); // No 1.6.x available
  });

  it('returns null when no matching major version', () => {
    const result = findExactMinorMatch('2.0.0', availableVersions);
    expect(result).toBeNull();
  });

  it('works with single matching version', () => {
    const result = findExactMinorMatch('1.7.6', availableVersions);
    expect(result).toBe('1.7.7'); // Highest patch in 1.7.x
  });
});

describe('getTypesStrategy', () => {
  it('uses @types/p5 for version 1.x', () => {
    const strategy = getTypesStrategy('1.9.0');
    expect(strategy.useTypesPackage).toBe(true);
    expect(strategy.reason).toContain('1.x uses @types/p5');
  });

  it('uses bundled types for version 2.0.0', () => {
    const strategy = getTypesStrategy('2.0.0');
    expect(strategy.useTypesPackage).toBe(false);
    expect(strategy.reason).toContain('2.x has bundled types');
  });

  it('uses bundled types for version 2.0.1', () => {
    const strategy = getTypesStrategy('2.0.1');
    expect(strategy.useTypesPackage).toBe(false);
  });

  it('uses bundled types for version 2.1.1', () => {
    const strategy = getTypesStrategy('2.1.1');
    expect(strategy.useTypesPackage).toBe(false);
  });

  it('uses bundled types for future versions (3.x+)', () => {
    const strategy = getTypesStrategy('3.0.0');
    expect(strategy.useTypesPackage).toBe(false);
  });
});

describe('fetchTypesVersions', () => {
  it('fetches @types/p5 versions successfully', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('@types/p5')) {
        return {
          ok: true,
          json: async () => ({
            versions: ['1.7.7', '1.7.6', '1.5.0', '1.4.2']
          })
        };
      }
    };

    const versions = await fetchTypesVersions();
    expect(versions).toEqual(['1.7.7', '1.7.6', '1.5.0', '1.4.2']);
  });

  it('throws error on network failure', async () => {
    globalThis.fetch = async () => {
      throw new Error('fetch failed');
    };

    await expect(fetchTypesVersions()).rejects.toThrow('Unable to reach jsdelivr CDN API');
  });
});

describe('downloadTypeDefinitions for p5.js 1.x', () => {
  it('downloads from closest matching @types/p5 version for 1.4.0', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      if (url.includes('/v1/package/npm/@types/p5')) {
        return {
          ok: true,
          json: async () => ({
            versions: ['1.7.7', '1.7.6', '1.5.0', '1.4.3', '1.4.2']
          })
        };
      }

      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('1.4.0', tmpDir, null, null, false);
    expect(actual).toBe('1.4.3'); // Closest match to 1.4.0

    // Verify files downloaded from correct version
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.4.3/global.d.ts');
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.4.3/index.d.ts');
  });

  it('downloads from closest available version when exact minor not found', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      if (url.includes('/v1/package/npm/@types/p5')) {
        return {
          ok: true,
          json: async () => ({
            versions: ['1.7.7', '1.5.0', '1.3.0'] // No 1.9.x available
          })
        };
      }

      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('1.9.0', tmpDir, null, null, false);
    expect(actual).toBe('1.7.7'); // Closest to 1.9.0

    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/global.d.ts');
  });

  it('downloads only index.d.ts for instance mode', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      if (url.includes('/v1/package/npm/@types/p5')) {
        return {
          ok: true,
          json: async () => ({
            versions: ['1.7.7']
          })
        };
      }

      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    await downloadTypeDefinitions('1.9.0', tmpDir, null, 'instance', false);

    // Should only fetch index.d.ts for instance mode
    const typesFetches = fetchedUrls.filter(url => url.includes('@types/p5@') && url.endsWith('.d.ts'));
    expect(typesFetches).toHaveLength(1);
    expect(typesFetches[0]).toContain('index.d.ts');
  });
});

describe('downloadTypeDefinitions for p5.js 2.x', () => {
  it('downloads bundled types for version 2.1.1 (exact match)', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('2.1.1', tmpDir, null, null, false);
    expect(actual).toBe('2.1.1'); // Exact match

    // Verify bundled types URLs
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/p5@2.1.1/types/global.d.ts');
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/p5@2.1.1/types/p5.d.ts');
  });

  it('falls back to closest 2.x version for 2.0.0 (no bundled types)', async () => {
    const fetchedUrls = [];
    let callCount = 0;

    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      callCount++;

      // First call: test if 2.0.0/types exists -> 404
      if (callCount === 1 && url.includes('p5@2.0.0/types')) {
        return { ok: false, status: 404 };
      }

      // Second call: fetchVersions for fallback
      if (url.includes('/v1/package/npm/p5')) {
        return {
          ok: true,
          json: async () => ({
            tags: { latest: '2.1.1' },
            versions: ['2.1.1', '2.1.0', '2.0.2', '2.0.1', '2.0.0']
          })
        };
      }

      // Subsequent calls: actual type file downloads
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('2.0.0', tmpDir, null, null, false);
    expect(actual).toBe('2.0.2'); // Closest 2.x version with types

    // Verify fallback to 2.0.2
    expect(fetchedUrls.some(url => url.includes('p5@2.0.2/types/global.d.ts'))).toBe(true);
  });

  it('falls back to closest 2.x version for 2.0.1 (no bundled types)', async () => {
    const fetchedUrls = [];
    let callCount = 0;

    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      callCount++;

      // First call: test if 2.0.1/types exists -> 404
      if (callCount === 1 && url.includes('p5@2.0.1/types')) {
        return { ok: false, status: 404 };
      }

      // Second call: fetchVersions for fallback
      if (url.includes('/v1/package/npm/p5')) {
        return {
          ok: true,
          json: async () => ({
            tags: { latest: '2.1.1' },
            versions: ['2.1.1', '2.1.0', '2.0.2', '2.0.1', '2.0.0']
          })
        };
      }

      // Subsequent calls: actual type file downloads
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('2.0.1', tmpDir, null, null, false);
    expect(actual).toBe('2.0.2'); // Closest available

    expect(fetchedUrls.some(url => url.includes('p5@2.0.2/types/global.d.ts'))).toBe(true);
  });

  it('downloads only p5.d.ts for instance mode', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    await downloadTypeDefinitions('2.1.1', tmpDir, null, 'instance', false);

    // Should fetch p5.d.ts twice: once to test existence, once to download
    // Filter to unique URLs
    const uniqueUrls = [...new Set(fetchedUrls)];
    const typesFetches = uniqueUrls.filter(url => url.includes('p5@2.1.1/types/') && url.endsWith('.d.ts'));
    expect(typesFetches).toHaveLength(1);
    expect(typesFetches[0]).toContain('p5.d.ts');
  });
});

describe('downloadTypeDefinitions error handling', () => {
  it('throws error on network failure', async () => {
    globalThis.fetch = async () => {
      throw new Error('fetch failed');
    };

    await expect(downloadTypeDefinitions('1.9.0', tmpDir, null, null, false)).rejects.toThrow(
      'Failed to download TypeScript definitions'
    );
  });

  it('throws error when no compatible version found', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('@types/p5')) {
        return {
          ok: true,
          json: async () => ({
            versions: ['2.0.0', '2.1.0'] // No 1.x versions
          })
        };
      }
      return { ok: false, status: 404 };
    };

    await expect(downloadTypeDefinitions('1.9.0', tmpDir, null, null, false)).rejects.toThrow(
      'No compatible @types/p5 version found'
    );
  });
});
