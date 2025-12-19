import degit from 'degit';
import { parseGitHubSpec, isSingleFile, downloadSingleFile, downloadGitHubArchive } from './githubFallback.js';

/**
 * Detect whether the provided template spec refers to a remote template
 * (GitHub shorthand or a full URL).
 *
 * @param {string} t
 * @returns {boolean}
 */
export function isRemoteTemplateSpec(t) {
  if (!t || typeof t !== 'string') return false;
  if (/^https?:\/\//.test(t)) return true;
  if (/^[^\s]+\/[^^\s]+/.test(t)) return true;
  return false;
}


/**
 * Normalize common GitHub URL forms into a degit-friendly spec.
 * Degit supports:
 * - user/repo
 * - user/repo/subdirectory
 * - user/repo#branch
 * - user/repo/subdirectory#branch
 * - Full GitHub URLs (github:user/repo, gitlab:user/repo, etc.)
 *
 * Examples:
 * - https://github.com/user/repo -> user/repo
 * - https://github.com/user/repo.git -> user/repo
 * - https://github.com/user/repo/tree/branch/path -> user/repo/path#branch
 *
 * @param {string} t
 * @returns {string}
 */
export function normalizeTemplateSpec(t) {
  if (!t || typeof t !== 'string') return t;

  // Handle full URLs first (GitHub tree/blob forms)
  if (/^https?:\/\//.test(t)) {
    try {
      const u = new URL(t);
      if (u.hostname.includes('github.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const user = parts[0];
          let repo = parts[1].replace(/\.git$/, '');

          // Handle /tree/<ref>/path/to/subdir
          if (parts[2] === 'tree' && parts[3]) {
            const branch = parts[3];
            const subpath = parts.slice(4).join('/');
            let spec = `${user}/${repo}`;
            if (subpath) spec += `/${subpath}`;
            spec += `#${branch}`;
            return spec;
          }

          // Handle blob URLs - treat as subdirectory (degit will clone the repo/subdir)
          if (parts[2] === 'blob' && parts[3]) {
            const ref = parts[3];
            const filePath = parts.slice(4).join('/');
            let spec = `${user}/${repo}`;
            if (filePath) spec += `/${filePath}`;
            spec += `#${ref}`;
            return spec;
          }

          return `${user}/${repo}`;
        }
      }
    } catch (e) {
      // ignore and fall through
    }
  }

  // Handle shorthand forms and "#ref/path" syntaxes
  // Examples:
  // - user/repo -> user/repo
  // - user/repo/subdir -> user/repo/subdir
  // - user/repo#ref -> user/repo#ref
  // - user/repo#ref/path -> user/repo/path#ref
  // - user/repo/path#ref -> user/repo/path#ref (already ok)
  if (t.includes('#')) {
    const [base, hash] = t.split('#', 2);
    if (!hash) return t;

    // If hash contains a slash, interpret as ref/path -> convert to base/path#ref
    if (hash.includes('/')) {
      const parts = hash.split('/');
      const ref = parts.shift();
      const subpath = parts.join('/');
      let baseParts = base.split('/').filter(Boolean);
      if (baseParts.length >= 2) {
        // strip .git from repo name if present
        baseParts[1] = baseParts[1].replace(/\.git$/, '');
        const normalizedBase = baseParts.join('/');
        return subpath ? `${normalizedBase}/${subpath}#${ref}` : `${normalizedBase}#${ref}`;
      }
    }

    // No slash in hash -> already in degit-friendly form (base#ref)
    // Ensure repo .git suffix removed when possible
    const bp = base.split('/').filter(Boolean);
    if (bp.length >= 2) {
      bp[1] = bp[1].replace(/\.git$/, '');
      return `${bp.join('/') }#${hash}`;
    }
  }

  // For non-URL, non-hash shorthand preserve but strip .git from repo if present
  const parts = t.split('/').filter(Boolean);
  if (parts.length >= 2) {
    parts[1] = parts[1].replace(/\.git$/, '');
    return parts.join('/');
  }

  return t;
}


/**
 * Clone a remote template into `targetPath` using `degit`.
 * Accepts full URLs, GitHub shorthand, and branch/subpath specifiers.
 * Supports all formats that degit supports:
 * - user/repo
 * - user/repo/subdirectory
 * - user/repo#branch
 * - user/repo/subdirectory#branch
 * - gitlab:user/repo
 * - bitbucket:user/repo
 *
 * Falls back to direct GitHub archive download if degit fails.
 * Supports single-file templates via blob URLs.
 *
 * @param {string} templateSpec
 * @param {string} targetPath
 * @param {{verbose?:boolean}} [options]
 */
export async function fetchTemplate(templateSpec, targetPath, options = {}) {
  const spec = normalizeTemplateSpec(templateSpec);

  // Try degit first
  try {
    const emitter = degit(spec, { cache: false, force: true, verbose: !!options.verbose });
    await emitter.clone(targetPath);
    return;
  } catch (degitError) {
    // If degit fails, try fallback for GitHub repos
    const parsed = parseGitHubSpec(spec);

    if (!parsed) {
      // Can't parse as GitHub spec, re-throw original error
      throw degitError;
    }

    const { user, repo, ref, subpath } = parsed;

    try {
      // Check if this is a single file
      if (isSingleFile(subpath)) {
        await downloadSingleFile(user, repo, ref, subpath, targetPath);
      } else {
        // Download directory via archive
        await downloadGitHubArchive(user, repo, ref, subpath, targetPath);
      }
    } catch (fallbackError) {
      // If fallback also fails, throw the original degit error for better context
      throw new Error(`${degitError.message} (fallback also failed: ${fallbackError.message})`);
    }
  }
}
