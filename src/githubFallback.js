import https from 'https';
import { createWriteStream, promises as fs } from 'fs';
import { createGunzip } from 'zlib';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const tar = require('tar');

/**
 * Parse a normalized template spec into its components
 * @param {string} spec - Normalized spec (user/repo/path#ref)
 * @returns {{user: string, repo: string, ref: string, subpath: string} | null}
 */
export function parseGitHubSpec(spec) {
  if (!spec) return null;

  // Split by # to separate ref
  const [basePart, ref = 'main'] = spec.split('#');
  const parts = basePart.split('/').filter(Boolean);

  if (parts.length < 2) return null;

  const [user, repo, ...subpathParts] = parts;
  const subpath = subpathParts.join('/');

  return { user, repo, ref, subpath };
}

/**
  * Known file extensions that should be treated as single files when downloading from GitHub.
 * This helps avoid misclassifying directories with dots in their names (e.g. "v1.0") as files.
 * @type {Set<string>}
 */
const KNOWN_SINGLE_FILE_EXTENSIONS = new Set([
  '.js',
  '.ts',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.htm',
  '.css',
  '.glsl',
  '.vert',
  '.frag',
  '.md',
  '.markdown',
  '.mdx',
  '.txt',
  '.zip',
  '.tar',
  '.tgz',
  '.gz'
]);
/**
 * Check if a path points to a single file (has a known file extension)
 * @param {string} subpath
 * @returns {boolean}
 */
export function isSingleFile(subpath) {
  if (!subpath) return false;
  const basename = subpath.split('/').pop() || '';
  const ext = path.extname(basename).toLowerCase();
  if (!ext) return false;
  return KNOWN_SINGLE_FILE_EXTENSIONS.has(ext);
}

/**
 * Download a single file from GitHub
 * @param {string} user
 * @param {string} repo
 * @param {string} ref
 * @param {string} filepath
 * @param {string} targetPath
 */
export async function downloadSingleFile(user, repo, ref, filepath, targetPath) {
  const url = `https://raw.githubusercontent.com/${user}/${repo}/${ref}/${filepath}`;
  const filename = filepath.split('/').pop();

  await fs.mkdir(targetPath, { recursive: true });
  const filePath = path.join(targetPath, filename);

  return new Promise((resolve, reject) => {
    const downloadWithRedirects = (urlToFetch, redirectCount = 0) => {
      if (redirectCount > 10) {
        reject(new Error('Too many redirects'));
        return;
      }

      https.get(urlToFetch, (response) => {
        if (response.statusCode === 404) {
          reject(new Error(`File not found: ${url}`));
          return;
        }

        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 ||
            response.statusCode === 307 || response.statusCode === 308) {
          const location = response.headers.location;
          if (!location) {
            reject(new Error(`Redirect without Location header: HTTP ${response.statusCode}`));
            return;
          }
          response.resume();
          response.on('end', () => {
            downloadWithRedirects(location, redirectCount + 1);
          });
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
          return;
        }

        const fileStream = createWriteStream(filePath);
        response.on('error', reject);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', reject);
      }).on('error', reject);
    };

    downloadWithRedirects(url);
  });
}

/**
 * Download and extract a GitHub repository subdirectory using tar archive
 * @param {string} user
 * @param {string} repo
 * @param {string} ref
 * @param {string} subpath
 * @param {string} targetPath
 */
export async function downloadGitHubArchive(user, repo, ref, subpath, targetPath) {
  const archiveUrl = `https://codeload.github.com/${user}/${repo}/tar.gz/${ref}`;

  await fs.mkdir(targetPath, { recursive: true });

  return new Promise((resolve, reject) => {
    const downloadWithRedirects = (urlToFetch, redirectCount = 0) => {
      if (redirectCount > 10) {
        reject(new Error('Too many redirects'));
        return;
      }

      https.get(urlToFetch, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 ||
            response.statusCode === 307 || response.statusCode === 308) {
          const location = response.headers.location;
          if (!location) {
            reject(new Error(`Redirect without Location header: HTTP ${response.statusCode}`));
            return;
          }
          downloadWithRedirects(location, redirectCount + 1);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download archive: HTTP ${response.statusCode}`));
          return;
        }

        const repoPrefix = `${repo}-${ref}/`;
        const stripPrefix = subpath ? `${repoPrefix}${subpath}/` : repoPrefix;

        const extractor = tar.extract({
          cwd: targetPath,
          strip: stripPrefix.split('/').length - 1,
          filter: (entryPath) => {
            // Only extract files that are in the target subpath
            if (subpath) {
              return entryPath.startsWith(stripPrefix);
            }
            return entryPath.startsWith(repoPrefix);
          }
        });

        const gunzip = createGunzip();

        // Ensure errors from all streams in the pipeline reject the promise
        response.on('error', reject);
        gunzip.on('error', reject);
        extractor.on('error', reject);
        extractor.on('finish', resolve);

        response.pipe(gunzip).pipe(extractor);
      }).on('error', reject);
    };

    downloadWithRedirects(archiveUrl);
  });
}
