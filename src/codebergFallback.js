import https from 'https';
import { promises as fs, createWriteStream } from 'fs';
import { createGunzip } from 'zlib';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const tar = require('tar');

/**
 * Parse a Codeberg URL or spec into its components
 * Supports multiple formats:
 * - codeberg:user/repo
 * - codeberg:user/repo/subpath#ref
 * - git@codeberg.org:user/repo
 * - https://codeberg.org/user/repo
 * @param {string} spec - Codeberg URL or spec
 * @returns {{user: string, repo: string, ref: string, subpath: string} | null}
 */
export function parseCodebergSpec(spec) {
  if (!spec) return null;

  // Handle codeberg:user/repo shorthand
  if (/^codeberg:/.test(spec)) {
    const withoutPrefix = spec.replace(/^codeberg:/, '');
    const [basePart, hashRef] = withoutPrefix.split('#');
    const parts = basePart.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const user = parts[0];
    const repo = parts[1].replace(/\.git$/, '');

    let ref = 'main';
    let subpath = '';

    // Check for src/branch/ref/path pattern (similar to Codeberg web URLs)
    if (parts[2] === 'src' && parts[3] === 'branch' && parts[4]) {
      ref = parts[4];
      subpath = parts.slice(5).join('/');
    } else {
      // Everything after repo is subpath
      subpath = parts.slice(2).join('/');
    }

    // Hash ref overrides path-based ref
    if (hashRef) {
      ref = hashRef;
    }

    return { user, repo, ref, subpath };
  }

  // Handle git@codeberg.org:user/repo SSH format
  if (/^git@codeberg\.org:/.test(spec)) {
    const withoutPrefix = spec.replace(/^git@codeberg\.org:/, '');
    const [basePart, hashRef] = withoutPrefix.split('#');
    const parts = basePart.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const user = parts[0];
    const repo = parts[1].replace(/\.git$/, '');

    let ref = 'main';
    let subpath = '';

    // Check for src/branch/ref/path pattern (similar to Codeberg web URLs)
    if (parts[2] === 'src' && parts[3] === 'branch' && parts[4]) {
      ref = parts[4];
      subpath = parts.slice(5).join('/');
    } else {
      // Everything after repo is subpath
      subpath = parts.slice(2).join('/');
    }

    // Hash ref overrides path-based ref
    if (hashRef) {
      ref = hashRef;
    }

    return { user, repo, ref, subpath };
  }

  // Handle full Codeberg URLs: https://codeberg.org/user/repo/... or https://codeberg.org/user/repo#ref
  if (/^https?:\/\/codeberg\.org/.test(spec)) {
    try {
      const urlWithoutHash = spec.split('#')[0];
      let hashRef = spec.includes('#') ? spec.split('#')[1] : null;
      const u = new URL(urlWithoutHash);
      const parts = u.pathname.split('/').filter(Boolean);

      if (parts.length < 2) return null;

      const user = parts[0];
      const repo = parts[1].replace(/\.git$/, '');

      let ref = 'main';
      let subpath = '';

      // Check for src/branch/ref/path pattern
      if (parts[2] === 'src' && parts[3] === 'branch' && parts[4]) {
        ref = parts[4];
        subpath = parts.slice(5).join('/');
      } else {
        // Everything after repo is subpath
        subpath = parts.slice(2).join('/');
      }

      // Hash ref overrides URL-based ref
      if (hashRef) {
        ref = hashRef;
      }

      return { user, repo, ref, subpath };
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Download a Codeberg repository archive and extract it to targetPath
 * @param {string} user
 * @param {string} repo
 * @param {string} ref
 * @param {string} subpath
 * @param {string} targetPath
 */
export async function downloadCodebergArchive(user, repo, ref, subpath, targetPath) {
  const archiveUrl = `https://codeberg.org/${user}/${repo}/archive/${ref}.tar.gz`;

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

        // Codeberg archive format: repo-ref/
        const repoPrefix = `${repo}/`;
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

/**
 * Download a single file from Codeberg
 * @param {string} user
 * @param {string} repo
 * @param {string} ref
 * @param {string} filepath
 * @param {string} targetPath
 */
export async function downloadCodebergSingleFile(user, repo, ref, filepath, targetPath) {
  // Codeberg API raw file URL format
  const rawUrl = `https://codeberg.org/api/v1/repos/${user}/${repo}/raw/${filepath}?ref=${ref}`;
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
          reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
          return;
        }

        // Write directly to target as a file
        const writeStream = createWriteStream(filePath);

        response.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);

        response.pipe(writeStream);
      }).on('error', reject);
    };

    downloadWithRedirects(rawUrl);
  });
}
