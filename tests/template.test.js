import { describe, it, expect } from 'vitest';
import { injectP5Script } from '../src/template.js';

const baseHtml = `<!doctype html>
<html>
<head>
  <!-- P5JS_SCRIPT_TAG -->
  <meta charset="utf-8">
</head>
<body>
  <script src="sketch.js"></script>
</body>
</html>`;

describe('injectP5Script', () => {
  it('replaces marker with CDN script tag', () => {
    const out = injectP5Script(baseHtml, '1.9.0', 'cdn');
    expect(out).toMatch(/cdn\.jsdelivr\.net/);
    expect(out).toMatch(/p5@1.9.0/);
  });

  it('inserts local script when mode is local', () => {
    const out = injectP5Script(baseHtml, '1.9.0', 'local');
    expect(out).toMatch(/\.\/lib\/p5\.js/);
  });
});
