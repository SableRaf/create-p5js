import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import {
  parseCodebergSpec,
  downloadCodebergSingleFile,
  downloadCodebergArchive
} from '../src/codebergFallback.js';
import { isSingleFile } from '../src/githubFallback.js';

const tmpDir = path.join('tests', 'tmp-codeberg-fallback');

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('parseCodebergSpec', () => {
  it('parses codeberg:user/repo shorthand', () => {
    const result = parseCodebergSpec('codeberg:user/repo');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: ''
    });
  });

  it('parses codeberg:user/repo with custom ref', () => {
    const result = parseCodebergSpec('codeberg:user/repo#dev');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'dev',
      subpath: ''
    });
  });

  it('parses codeberg:user/repo/subpath', () => {
    const result = parseCodebergSpec('codeberg:user/repo/examples/basic');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'examples/basic'
    });
  });

  it('parses codeberg:user/repo/subpath#ref', () => {
    const result = parseCodebergSpec('codeberg:user/repo/templates#v1.0');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'v1.0',
      subpath: 'templates'
    });
  });

  it('parses codeberg:user/repo/src/branch/ref/file', () => {
    const result = parseCodebergSpec('codeberg:user/repo/src/branch/main/README.md');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'README.md'
    });
  });

  it('parses codeberg:user/repo/src/branch/ref/path/to/file', () => {
    const result = parseCodebergSpec('codeberg:user/repo/src/branch/develop/examples/basic.js');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'develop',
      subpath: 'examples/basic.js'
    });
  });

  it('parses git@codeberg.org:user/repo SSH format', () => {
    const result = parseCodebergSpec('git@codeberg.org:user/repo');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: ''
    });
  });

  it('parses git@codeberg.org:user/repo with custom ref', () => {
    const result = parseCodebergSpec('git@codeberg.org:user/repo#develop');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'develop',
      subpath: ''
    });
  });

  it('parses git@codeberg.org:user/repo/subpath', () => {
    const result = parseCodebergSpec('git@codeberg.org:user/repo/src/templates');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'src/templates'
    });
  });

  it('parses git@codeberg.org:user/repo.git', () => {
    const result = parseCodebergSpec('git@codeberg.org:user/repo.git');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: ''
    });
  });

  it('parses git@codeberg.org:user/repo/src/branch/ref/file', () => {
    const result = parseCodebergSpec('git@codeberg.org:user/repo/src/branch/main/index.html');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'index.html'
    });
  });

  it('parses git@codeberg.org:user/repo/src/branch/ref/path/to/file', () => {
    const result = parseCodebergSpec('git@codeberg.org:user/repo/src/branch/v1.0/src/app.js');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'v1.0',
      subpath: 'src/app.js'
    });
  });

  it('parses basic Codeberg URL', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: ''
    });
  });

  it('parses Codeberg URL with custom ref', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo#dev');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'dev',
      subpath: ''
    });
  });

  it('parses Codeberg URL with src/branch path', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo/src/branch/main/path/to/file');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'path/to/file'
    });
  });

  it('parses Codeberg URL with src/branch and custom ref', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo/src/branch/develop/examples/basic');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'develop',
      subpath: 'examples/basic'
    });
  });

  it('parses Codeberg URL with hash override', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo#v1.0');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'v1.0',
      subpath: ''
    });
  });

  it('parses Codeberg URL with subpath after repo', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo/templates/basic');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'templates/basic'
    });
  });

  it('handles Codeberg URL with trailing slash', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo/');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: ''
    });
  });

  it('returns null for non-Codeberg URLs', () => {
    expect(parseCodebergSpec('https://github.com/user/repo')).toBeNull();
    expect(parseCodebergSpec('user/repo')).toBeNull();
  });

  it('returns null for empty or invalid input', () => {
    expect(parseCodebergSpec('')).toBeNull();
    expect(parseCodebergSpec(null)).toBeNull();
  });

  it('returns null for Codeberg URL with only user', () => {
    const result = parseCodebergSpec('https://codeberg.org/user');
    expect(result).toBeNull();
  });

  it('handles http protocol', () => {
    const result = parseCodebergSpec('http://codeberg.org/user/repo');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: ''
    });
  });

  it('filters out empty path parts', () => {
    const result = parseCodebergSpec('https://codeberg.org/user/repo//path//to/file');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'path/to/file'
    });
  });
});

describe('downloadCodebergSingleFile', () => {
  function createMockResponse(statusCode, data = '', headers = {}) {
    const response = new Readable();
    response.statusCode = statusCode;
    response.headers = headers;
    response._read = () => {};

    // Simulate async data emission
    setImmediate(() => {
      response.push(data);
      response.push(null);
    });

    return response;
  }

  it('downloads a file successfully', async () => {
    const mockResponse = createMockResponse(200, '// file content');

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await downloadCodebergSingleFile('user', 'repo', 'main', 'test.js', tmpDir);

    const content = await fs.readFile(path.join(tmpDir, 'test.js'), 'utf-8');
    expect(content).toBe('// file content');
  });

  it('constructs correct Codeberg API URL', async () => {
    let capturedUrl = '';

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      capturedUrl = url;
      const mockResponse = createMockResponse(404); // Fail fast for test
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergSingleFile('user', 'repo', 'main', 'README.md', tmpDir)
    ).rejects.toThrow();

    expect(capturedUrl).toBe('https://codeberg.org/api/v1/repos/user/repo/raw/README.md?ref=main');
  });

  it('constructs correct URL with custom ref', async () => {
    let capturedUrl = '';

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      capturedUrl = url;
      const mockResponse = createMockResponse(404);
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergSingleFile('user', 'repo', 'develop', 'src/file.js', tmpDir)
    ).rejects.toThrow();

    expect(capturedUrl).toBe('https://codeberg.org/api/v1/repos/user/repo/raw/src/file.js?ref=develop');
  });

  it('creates target directory if it does not exist', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'dir');
    const mockResponse = createMockResponse(200, 'content');

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await downloadCodebergSingleFile('user', 'repo', 'main', 'file.js', nestedDir);

    const exists = await fs.access(nestedDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('extracts filename from path', async () => {
    const mockResponse = createMockResponse(200, 'content');

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await downloadCodebergSingleFile('user', 'repo', 'main', 'path/to/file.js', tmpDir);

    const exists = await fs.access(path.join(tmpDir, 'file.js')).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('throws error on non-200/redirect status codes', async () => {
    const mockResponse = createMockResponse(500);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Failed to download file: HTTP 500');
  });

  it('throws error on 404 status', async () => {
    const mockResponse = createMockResponse(404);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergSingleFile('user', 'repo', 'main', 'missing.js', tmpDir)
    ).rejects.toThrow('Failed to download file: HTTP 404');
  });

  it('follows redirects (301)', async () => {
    let callCount = 0;
    const redirectUrl = 'https://new-location.com/file.js';

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callCount++;
      if (callCount === 1) {
        const redirectResponse = createMockResponse(301, '', {
          location: redirectUrl
        });
        callback(redirectResponse);
      } else {
        const finalResponse = createMockResponse(200, 'redirected content');
        callback(finalResponse);
      }
      return { on: () => ({}) };
    });

    await downloadCodebergSingleFile('user', 'repo', 'main', 'file.js', tmpDir);

    const content = await fs.readFile(path.join(tmpDir, 'file.js'), 'utf-8');
    expect(content).toBe('redirected content');
    expect(callCount).toBe(2);
  });

  it('follows multiple redirect types (302, 307, 308)', async () => {
    for (const statusCode of [302, 307, 308]) {
      let callCount = 0;
      const redirectUrl = 'https://new-location.com/file.js';

      vi.spyOn(https, 'get').mockImplementation((url, callback) => {
        callCount++;
        if (callCount === 1) {
          const redirectResponse = createMockResponse(statusCode, '', {
            location: redirectUrl
          });
          callback(redirectResponse);
        } else {
          const finalResponse = createMockResponse(200, `content-${statusCode}`);
          callback(finalResponse);
        }
        return { on: () => ({}) };
      });

      const testDir = path.join(tmpDir, `test-${statusCode}`);
      await fs.mkdir(testDir, { recursive: true });
      await downloadCodebergSingleFile('user', 'repo', 'main', 'file.js', testDir);

      const content = await fs.readFile(path.join(testDir, 'file.js'), 'utf-8');
      expect(content).toBe(`content-${statusCode}`);

      vi.restoreAllMocks();
    }
  });

  it('throws error when redirect has no location header', async () => {
    const mockResponse = createMockResponse(301, '', {});

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Redirect without Location header: HTTP 301');
  });

  it('throws error after too many redirects', async () => {
    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      const redirectResponse = createMockResponse(301, '', {
        location: 'https://redirect-loop.com/file.js'
      });
      callback(redirectResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Too many redirects');
  });

  it('throws error on network error', async () => {
    vi.spyOn(https, 'get').mockImplementation(() => {
      const request = {
        on: (event, handler) => {
          if (event === 'error') {
            setImmediate(() => handler(new Error('Network error')));
          }
          return request;
        }
      };
      return request;
    });

    await expect(
      downloadCodebergSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Network error');
  });
});

describe('downloadCodebergArchive', () => {
  function createMockResponse(statusCode, data = '', headers = {}) {
    const response = new Readable();
    response.statusCode = statusCode;
    response.headers = headers;
    response._read = () => {};

    // Simulate async data emission
    setImmediate(() => {
      response.push(data);
      response.push(null);
    });

    return response;
  }

  it('constructs correct Codeberg archive URL', async () => {
    let capturedUrl = '';

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      capturedUrl = url;
      const mockResponse = createMockResponse(404); // Fail fast for test
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', 'examples', tmpDir)
    ).rejects.toThrow();

    expect(capturedUrl).toBe('https://codeberg.org/user/repo/archive/main.tar.gz');
  });

  it('constructs correct URL with custom ref', async () => {
    let capturedUrl = '';

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      capturedUrl = url;
      const mockResponse = createMockResponse(404);
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'v1.0', '', tmpDir)
    ).rejects.toThrow();

    expect(capturedUrl).toBe('https://codeberg.org/user/repo/archive/v1.0.tar.gz');
  });

  it('throws error on non-200/redirect status codes', async () => {
    const mockResponse = createMockResponse(500);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Failed to download archive: HTTP 500');
  });

  it('throws error on 404 status', async () => {
    const mockResponse = createMockResponse(404);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Failed to download archive: HTTP 404');
  });

  it('follows redirects with correct status codes', async () => {
    let callCount = 0;

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callCount++;
      if (callCount === 1) {
        const redirectResponse = createMockResponse(302, '', {
          location: 'https://new-location.com/archive.tar.gz'
        });
        callback(redirectResponse);
      } else {
        // Return a mock response that will fail extraction but proves redirect worked
        const mockResponse = createMockResponse(404);
        callback(mockResponse);
      }
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow();

    expect(callCount).toBe(2);
  });

  it('throws error when redirect has no location header', async () => {
    const mockResponse = createMockResponse(301, '', {});

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Redirect without Location header: HTTP 301');
  });

  it('throws error after too many redirects', async () => {
    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      const redirectResponse = createMockResponse(301, '', {
        location: 'https://redirect-loop.com/archive.tar.gz'
      });
      callback(redirectResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Too many redirects');
  });

  it('throws error on network error', async () => {
    vi.spyOn(https, 'get').mockImplementation(() => {
      const request = {
        on: (event, handler) => {
          if (event === 'error') {
            setImmediate(() => handler(new Error('Network error')));
          }
          return request;
        }
      };
      return request;
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Network error');
  });

  it('creates target directory if it does not exist', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'archive-dir');
    const mockResponse = createMockResponse(404);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadCodebergArchive('user', 'repo', 'main', '', nestedDir)
    ).rejects.toThrow();

    const exists = await fs.access(nestedDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});

describe('Integration with isSingleFile', () => {
  it('correctly identifies single file Codeberg URLs', () => {
    expect(isSingleFile('README.md')).toBe(true);
    expect(isSingleFile('src/sketch.js')).toBe(true);
    expect(isSingleFile('examples/basic/index.html')).toBe(true);
    expect(isSingleFile('path/to/file.ts')).toBe(true);
  });

  it('correctly identifies directory paths', () => {
    expect(isSingleFile('examples')).toBe(false);
    expect(isSingleFile('src/components')).toBe(false);
    expect(isSingleFile('templates/basic')).toBe(false);
  });
});
