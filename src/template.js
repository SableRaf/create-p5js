import { parseHTML } from 'linkedom';

const P5_PATTERNS = [
  /^https?:\/\/cdn\.jsdelivr\.net\/npm\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
  /^https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/([^/]+)\/p5\.(?:min\.)?js$/,
  /^https?:\/\/unpkg\.com\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
  /^\.?\/?\blib\/p5(?:@([^/]+))?\.(min\.)?js$/
];

/**
 * HTMLManager - Parses and manipulates an HTML document string using linkedom.
 * Responsibilities:
 * - Parse HTML into a DOM
 * - Find existing p5.js script tags and detect CDN/provider and minification
 * - Insert or replace a p5.js script tag preserving user preferences
 */
class HTMLManager {
  /**
   * Create an HTMLManager instance from an HTML string
   * @param {string} htmlString - Raw HTML document string to parse
   */
  constructor(htmlString) {
    const { document } = parseHTML(htmlString);
    this.document = document;
  }

  /**
   * Serialize the DOM back to an HTML string with a DOCTYPE
   * @returns {string} The serialized HTML document
   */
  serialize() {
    const doctype = '<!DOCTYPE html>\n';
    return doctype + this.document.documentElement.outerHTML;
  }

  /**
   * Find an existing p5.js script tag in the document
   * @returns {{scriptNode: Element, version: string, isMinified: boolean, cdnProvider: string}|null}
   */
  findP5Script() {
    const scripts = this.document.querySelectorAll('script');

    for (const script of scripts) {
      const src = script.getAttribute('src') || '';

      for (const pattern of P5_PATTERNS) {
        const match = pattern.exec(src);
        if (match) {
          return {
            scriptNode: script,
            version: match[1] || 'local',
            isMinified: !!match[2],
            cdnProvider: this._detectCDN(src)
          };
        }
      }
    }

    return null;
  }

  /**
   * Update (or insert) the p5.js script tag for the given version and mode.
   * Strategy:
   * 1. Update existing p5 script tag if found
   * 2. Replace marker comment `<!-- P5JS_SCRIPT_TAG -->` if present
   * 3. Insert script into <head>
   *
   * @param {string} version - p5.js version to reference
   * @param {string} [mode='cdn'] - Delivery mode: 'cdn' or 'local'
   * @param {Object} [preferences={}] - Optional preferences: { isMinified: boolean, cdnProvider: string }
   * @returns {boolean} True if the document was modified, false otherwise
   */
  updateP5Script(version, mode = 'cdn', preferences = {}) {
    // Try update existing script
    const p5Info = this.findP5Script();
    if (p5Info) {
      const newURL = buildScriptURL(version, mode, {
        isMinified: p5Info.isMinified,
        cdnProvider: mode === 'cdn' ? p5Info.cdnProvider : undefined
      });
      p5Info.scriptNode.setAttribute('src', newURL);
      return true;
    }

    // Replace marker if present
    const marker = this._findMarker();
    if (marker) {
      const script = this.document.createElement('script');
      const newURL = buildScriptURL(version, mode, preferences);
      script.setAttribute('src', newURL);
      marker.parentNode.replaceChild(script, marker);
      return true;
    }

    // Insert into head
    if (this.document.head) {
      const script = this.document.createElement('script');
      const newURL = buildScriptURL(version, mode, preferences);
      script.setAttribute('src', newURL);
      const firstChild = this.document.head.firstChild;
      if (firstChild) this.document.head.insertBefore(script, firstChild);
      else this.document.head.appendChild(script);
      return true;
    }

    return false;
  }

  _findMarker() {
    const head = this.document.head;
    if (!head) return null;

    const findCommentInNode = (node) => {
      if (node.nodeType === 8) {
        if (node.textContent.trim() === 'P5JS_SCRIPT_TAG') return node;
      }

      for (const child of node.childNodes || []) {
        const found = findCommentInNode(child);
        if (found) return found;
      }

      return null;
    };

    return findCommentInNode(head);
  }

  _detectCDN(url) {
    if (/cdn\.jsdelivr\.net/.test(url)) return 'jsdelivr';
    if (/cdnjs\.cloudflare\.com/.test(url)) return 'cdnjs';
    if (/unpkg\.com/.test(url)) return 'unpkg';
    return 'jsdelivr';
  }
}

function buildScriptURL(version, mode, preferences = {}) {
  const file = preferences.isMinified ? 'p5.min.js' : 'p5.js';

  if (mode === 'local') return `./lib/${file}`;

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
 * Legacy helper that mirrors previous API: injectP5Script(htmlString, version, mode)
 * Internally uses HTMLManager for DOM operations.
 */
export function injectP5Script(htmlString, version, mode = 'cdn') {
  const mgr = new HTMLManager(htmlString);
  mgr.updateP5Script(version, mode);
  return mgr.serialize();
}

export { HTMLManager };
