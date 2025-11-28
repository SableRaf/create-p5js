import { describe, it, expect } from 'vitest';
import { HTMLManager } from '../src/template.js';

const htmlWithCdn = `<!doctype html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/p5@1.8.0/lib/p5.min.js"></script>
</head>
<body></body>
</html>`;

const htmlWithLocal = `<!doctype html>
<html>
<head>
  <script src="./lib/p5.js"></script>
</head>
<body></body>
</html>`;

describe('HTMLManager advanced detection and updates', () => {
  it('detects jsdelivr CDN and minified flag', () => {
    const mgr = new HTMLManager(htmlWithCdn);
    const info = mgr.findP5Script();
    expect(info).not.toBeNull();
    expect(info.version).toBe('1.8.0');
    expect(info.isMinified).toBe(true);
    expect(info.cdnProvider).toBe('jsdelivr');
  });

  it('detects local lib script', () => {
    const mgr = new HTMLManager(htmlWithLocal);
    const info = mgr.findP5Script();
    expect(info).not.toBeNull();
    expect(info.version).toBe('local');
  });

  it('updates existing script preserving minified and provider', () => {
    const mgr = new HTMLManager(htmlWithCdn);
    const changed = mgr.updateP5Script('1.9.0', 'cdn');
    expect(changed).toBe(true);
    const out = mgr.serialize();
    expect(out).toMatch(/p5@1.9.0/);
    expect(out).toMatch(/p5.min.js/);
  });
});
