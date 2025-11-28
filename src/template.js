import { parseHTML } from 'linkedom';

/**
 * CDN URL patterns for p5.js
 * Capture groups: (1) version, (2) 'min.' if minified
 */
const P5_PATTERNS = [
  /^https?:\/\/cdn\.jsdelivr\.net\/npm\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
  /^https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/([^/]+)\/p5\.(?:min\.)?js$/,
  /^https?:\/\/unpkg\.com\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
  /^\.?\/?\blib\/p5(?:@([^/]+))?\.(min\.)?js$/
];

/**
 * Injects p5.js script tag into HTML template
 * Uses three-tier strategy: update existing script, replace marker, or insert into head
 * @param {string} htmlString - The HTML content to modify
 * @param {string} version - The p5.js version to inject
 * @param {string} [mode='cdn'] - Delivery mode ('cdn' or 'local')
 * @returns {string} Modified HTML with p5.js script tag injected
 */
export function injectP5Script(htmlString, version, mode = 'cdn') {
  const { document } = parseHTML(htmlString);

  // Strategy 1: Look for existing p5.js script tag and update it
  const p5Info = findP5Script(document);
  if (p5Info) {
    const newURL = buildScriptURL(version, mode, {
      isMinified: p5Info.isMinified,
      cdnProvider: mode === 'cdn' ? p5Info.cdnProvider : undefined
    });
    p5Info.scriptNode.setAttribute('src', newURL);
    return serialize(document);
  }

  // Strategy 2: Look for marker comment and replace it
  const marker = findMarker(document);
  if (marker) {
    const script = document.createElement('script');
    const newURL = buildScriptURL(version, mode);
    script.setAttribute('src', newURL);
    marker.parentNode.replaceChild(script, marker);
    return serialize(document);
  }

  // Strategy 3: Insert at beginning of head
  if (document.head) {
    const script = document.createElement('script');
    const newURL = buildScriptURL(version, mode);
    script.setAttribute('src', newURL);

    const firstChild = document.head.firstChild;
    if (firstChild) {
      document.head.insertBefore(script, firstChild);
    } else {
      document.head.appendChild(script);
    }

    return serialize(document);
  }

  // Edge case: no head element
  return htmlString;
}

/**
 * Finds existing p5.js script tag in document
 * @param {Document} document - linkedom document
 * @returns {{ scriptNode: Element, version: string, isMinified: boolean, cdnProvider: string } | null}
 */
function findP5Script(document) {
  const scripts = document.querySelectorAll('script');

  for (const script of scripts) {
    const src = script.getAttribute('src') || '';

    for (const pattern of P5_PATTERNS) {
      const match = pattern.exec(src);
      if (match) {
        return {
          scriptNode: script,
          version: match[1] || 'local',
          isMinified: !!match[2],
          cdnProvider: detectCDN(src)
        };
      }
    }
  }

  return null;
}

/**
 * Detects CDN provider from URL
 * @param {string} url - Script URL
 * @returns {string} CDN provider name
 */
function detectCDN(url) {
  if (/cdn\.jsdelivr\.net/.test(url)) return 'jsdelivr';
  if (/cdnjs\.cloudflare\.com/.test(url)) return 'cdnjs';
  if (/unpkg\.com/.test(url)) return 'unpkg';
  return 'jsdelivr'; // default
}

/**
 * Builds script URL based on version, mode, and user preferences
 * @param {string} version - p5.js version
 * @param {string} mode - 'cdn' or 'local'
 * @param {Object} [preferences={}] - User preferences (isMinified, cdnProvider)
 * @returns {string} Script URL
 */
function buildScriptURL(version, mode, preferences = {}) {
  const file = preferences.isMinified ? 'p5.min.js' : 'p5.js';

  if (mode === 'local') {
    return `./lib/${file}`;
  }

  const cdn = preferences.cdnProvider || 'jsdelivr';

  switch (cdn) {
    case 'jsdelivr':
      return `https://cdn.jsdelivr.net/npm/p5@${version}/lib/${file}`;
    case 'cdnjs':
      return `https://cdnjs.cloudflare.com/ajax/libs/p5.js/${version}/${file}`;
    case 'unpkg':
      return `https://unpkg.com/p5@${version}/lib/${file}`;
    default:
      return `https://cdn.jsdelivr.net/npm/p5@${version}/lib/${file}`;
  }
}

/**
 * Finds the P5JS_SCRIPT_TAG marker comment in the document head
 * @param {Document} document - linkedom document
 * @returns {Comment | null} The marker comment node or null if not found
 */
function findMarker(document) {
  const head = document.head;
  if (!head) return null;

  const findCommentInNode = (node) => {
    if (node.nodeType === 8) { // COMMENT_NODE
      if (node.textContent.trim() === 'P5JS_SCRIPT_TAG') {
        return node;
      }
    }

    for (const child of node.childNodes || []) {
      const found = findCommentInNode(child);
      if (found) return found;
    }

    return null;
  };

  return findCommentInNode(head);
}

/**
 * Serializes linkedom document back to HTML string with DOCTYPE
 * @param {Document} document - linkedom document
 * @returns {string} Complete HTML string with DOCTYPE
 */
function serialize(document) {
  const doctype = '<!DOCTYPE html>\n';
  const html = document.documentElement.outerHTML;
  return doctype + html;
}
