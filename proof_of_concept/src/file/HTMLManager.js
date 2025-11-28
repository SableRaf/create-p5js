// HTMLManager - Handles HTML DOM manipulation using linkedom
import { parseHTML } from 'linkedom';

const basePath = 'sketch/';

export class HTMLManager {
  /**
   * CDN URL patterns for p5.js
   * Capture groups: (1) version, (2) 'min.' if minified
   */
  static P5_PATTERNS = [
    /^https?:\/\/cdn\.jsdelivr\.net\/npm\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
    /^https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/([^/]+)\/p5\.(?:min\.)?js$/,
    /^https?:\/\/unpkg\.com\/p5@([^/]+)\/lib\/p5\.(min\.)?js$/,
    /^\.?\/?\bsketch\/lib\/p5(?:@([^/]+))?\.(min\.)?js$/,
    /^\.?\/?\blib\/p5(?:@([^/]+))?\.(min\.)?js$/
  ];

  /**
   * Find p5.js script tag in document
   * @param {Document} document - linkedom document
   * @returns {{ scriptNode: Element, version: string, isMinified: boolean, cdnProvider: string } | null}
   */
  findP5Script(document) {
    const scripts = document.querySelectorAll('script');

    for (const script of scripts) {
      const src = script.getAttribute('src') || '';

      for (const pattern of HTMLManager.P5_PATTERNS) {
        const match = pattern.exec(src);
        if (match) {
          return {
            scriptNode: script,
            version: match[1] || 'local',
            isMinified: !!match[2],
            cdnProvider: this.detectCDN(src)
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect CDN provider from URL
   * @param {string} url - Script URL
   * @returns {string} CDN provider name
   */
  detectCDN(url) {
    if (/cdn\.jsdelivr\.net/.test(url)) return 'jsdelivr';
    if (/cdnjs\.cloudflare\.com/.test(url)) return 'cdnjs';
    if (/unpkg\.com/.test(url)) return 'unpkg';
    return 'jsdelivr'; // default
  }

  /**
   * Build script URL based on version, mode, and preferences
   * @param {string} version - p5.js version
   * @param {string} mode - 'cdn' or 'local'
   * @param {Object} preferences - User preferences (isMinified, cdnProvider)
   * @returns {string} Script URL
   */
  buildScriptURL(version, mode, preferences = {}) {
    const file = preferences.isMinified ? 'p5.min.js' : 'p5.js';

    if (mode === 'local') {
      return `/lib/${file}`;
    }

    const cdn = preferences.cdnProvider || 'jsdelivr';

    switch(cdn) {
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
   * Find marker comment in head
   * @param {Document} document - linkedom document
   * @returns {Comment | null} Marker comment node
   */
  findMarker(document) {
    // TreeWalker with NodeFilter is not fully supported in linkedom,
    // so we'll iterate through childNodes manually
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
   * Update p5.js script tag in HTML
   * @param {string} htmlString - HTML content
   * @param {string} version - p5.js version
   * @param {string} mode - 'cdn' or 'local'
   * @returns {{ html: string, updated: boolean, method: string }}
   */
  updateP5Script(htmlString, version, mode) {
    // Parse HTML
    const { document } = parseHTML(htmlString);

    // Try to find existing p5.js script
    const p5Info = this.findP5Script(document);

    if (p5Info) {
      // Update existing script tag
      const newURL = this.buildScriptURL(version, mode, {
        isMinified: p5Info.isMinified,
        cdnProvider: mode === 'cdn' ? p5Info.cdnProvider : undefined
      });

      p5Info.scriptNode.setAttribute('src', newURL);

      return {
        html: this.serialize(document),
        updated: true,
        method: 'updated-existing-script'
      };
    }

    // Try to find marker
    const marker = this.findMarker(document);

    if (marker) {
      // Replace marker with script tag
      const script = document.createElement('script');
      const newURL = this.buildScriptURL(version, mode);
      script.setAttribute('src', newURL);
      marker.parentNode.replaceChild(script, marker);

      return {
        html: this.serialize(document),
        updated: true,
        method: 'replaced-marker'
      };
    }

    // No script tag and no marker - insert into head
    if (document.head) {
      const script = document.createElement('script');
      const newURL = this.buildScriptURL(version, mode);
      script.setAttribute('src', newURL);

      // Insert as first child of head (before meta, link, etc.)
      const firstChild = document.head.firstChild;
      if (firstChild) {
        document.head.insertBefore(script, firstChild);
      } else {
        document.head.appendChild(script);
      }

      return {
        html: this.serialize(document),
        updated: true,
        method: 'inserted-new-script'
      };
    }

    // Edge case: no head element (invalid HTML)
    return {
      html: htmlString,
      updated: false,
      method: 'no-head-found'
    };
  }

  /**
   * Serialize document back to HTML string
   * @param {Document} document - linkedom document
   * @returns {string} HTML string
   */
  serialize(document) {
    const doctype = '<!DOCTYPE html>\n';
    const html = document.documentElement.outerHTML;
    return doctype + html;
  }
}

