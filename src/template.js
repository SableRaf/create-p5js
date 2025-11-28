import { parseHTML } from 'linkedom';

/**
 * Injects p5.js script tag into HTML template
 * Uses three-tier strategy: update existing script, replace marker, or insert into head
 * @param {string} htmlString - The HTML content to modify
 * @param {string} version - The p5.js version to inject
 * @returns {string} Modified HTML with p5.js script tag injected
 */
export function injectP5Script(htmlString, version) {
  const { document } = parseHTML(htmlString);

  // Build CDN URL
  const scriptUrl = `https://cdn.jsdelivr.net/npm/p5@${version}/lib/p5.js`;

  // Strategy 1: Look for marker comment
  const marker = findMarker(document);
  if (marker) {
    const script = document.createElement('script');
    script.setAttribute('src', scriptUrl);
    marker.parentNode.replaceChild(script, marker);
    return serialize(document);
  }

  // Strategy 2: Insert at beginning of head
  if (document.head) {
    const script = document.createElement('script');
    script.setAttribute('src', scriptUrl);

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
