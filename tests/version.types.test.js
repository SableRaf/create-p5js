import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import {
  downloadTypeDefinitions,
  parseVersion,
  getTypesStrategy,
} from "../src/version.js";

let originalFetch;
const tmpDir = path.join("tests", "tmp-types");

beforeEach(async () => {
  originalFetch = globalThis.fetch;
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("parseVersion", () => {
  it("parses stable versions correctly", () => {
    const result = parseVersion("1.9.0");
    expect(result).toEqual({ major: 1, minor: 9, patch: 0, prerelease: null });
  });

  it("parses prerelease versions correctly", () => {
    const result = parseVersion("2.1.0-rc.1");
    expect(result).toEqual({
      major: 2,
      minor: 1,
      patch: 0,
      prerelease: "rc.1",
    });
  });

  it("throws on invalid version strings", () => {
    expect(() => parseVersion("invalid")).toThrow("Invalid semver version");
  });
});

describe("getTypesStrategy", () => {
  it("uses @types/p5 package for p5.js 1.x", () => {
    const result = getTypesStrategy("1.9.0");
    expect(result.useTypesPackage).toBe(true);
    expect(result.reason).toContain("1.x");
  });

  it("uses bundled types for p5.js 2.x", () => {
    const result = getTypesStrategy("2.0.2");
    expect(result.useTypesPackage).toBe(false);
    expect(result.reason).toContain("2.x");
  });

  it("uses bundled types for p5.js 2.0.0", () => {
    const result = getTypesStrategy("2.0.0");
    expect(result.useTypesPackage).toBe(false);
    expect(result.reason).toContain("2.x");
  });
});

describe("downloadTypeDefinitions for p5.js 1.x", () => {
  it("copies minimal global.d.ts from repo for p5.js 1.x", async () => {
    const result = await downloadTypeDefinitions(
      "1.9.0",      // p5Version
      tmpDir,       // targetDir
      null,         // spinner
      null          // template (global mode)
    );

    // Should return fixed version for reference
    expect(result).toBe("1.7.7");

    // Check that global.d.ts was copied
    const globalDtsPath = path.join(tmpDir, "global.d.ts");
    const content = await fs.readFile(globalDtsPath, "utf-8");

    // Verify it contains the expected import statement
    expect(content).toContain('import * as p5Global from "p5/global"');
  });

  it("works for any p5.js 1.x version without network requests", async () => {
    // No network mocking needed - should copy from local file
    const result = await downloadTypeDefinitions(
      "1.4.0",
      tmpDir,
      null,
      null
    );

    expect(result).toBe("1.7.7");

    const globalDtsPath = path.join(tmpDir, "global.d.ts");
    const exists = await fs.access(globalDtsPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});

describe("downloadTypeDefinitions for p5.js 2.x", () => {
  it("downloads bundled types for p5.js 2.0.2+", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const result = await downloadTypeDefinitions(
      "2.0.2",      // p5Version
      tmpDir,       // targetDir
      null,         // spinner
      null          // template (global mode)
    );

    // Should use exact version
    expect(result).toBe("2.0.2");

    // Should download from p5 package, not @types/p5
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/p5@2.0.2/types/global.d.ts"
    );
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/p5@2.0.2/types/p5.d.ts"
    );
  });

  it("falls back to 2.0.2 for p5.js 2.0.0", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const result = await downloadTypeDefinitions(
      "2.0.0",
      tmpDir,
      null,
      null
    );

    // Should fallback to 2.0.2
    expect(result).toBe("2.0.2");
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/p5@2.0.2/types/global.d.ts"
    );
  });

  it("falls back to 2.0.2 for p5.js 2.0.1", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const result = await downloadTypeDefinitions(
      "2.0.1",
      tmpDir,
      null,
      null
    );

    expect(result).toBe("2.0.2");
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/p5@2.0.2/types/global.d.ts"
    );
  });

  it("falls back to 2.0.2 for p5.js 2.0.0-* pre-releases", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const result = await downloadTypeDefinitions(
      "2.0.0-rc.1",
      tmpDir,
      null,
      null
    );

    expect(result).toBe("2.0.2");
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/p5@2.0.2/types/global.d.ts"
    );
  });

  it("downloads only p5.d.ts for instance mode", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    await downloadTypeDefinitions(
      "2.1.0",
      tmpDir,
      null,
      "instance"    // template (instance mode)
    );

    // Should only download p5.d.ts for instance mode
    const typesFetches = fetchedUrls.filter(url => url.endsWith(".d.ts"));
    expect(typesFetches).toHaveLength(1);
    expect(typesFetches[0]).toContain("p5.d.ts");
    expect(typesFetches[0]).not.toContain("global.d.ts");
  });
});

describe("downloadTypeDefinitions version downgrade", () => {
  it("clears types folder when downgrading from 2.x to 1.x", async () => {
    // First, simulate 2.x types being present
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => "// p5.js 2.x types",
    });

    await downloadTypeDefinitions("2.1.0", tmpDir, null, null);

    // Verify 2.x types exist (global.d.ts and p5.d.ts)
    const globalDtsPath = path.join(tmpDir, "global.d.ts");
    const p5DtsPath = path.join(tmpDir, "p5.d.ts");

    let globalExists = await fs.access(globalDtsPath).then(() => true).catch(() => false);
    let p5Exists = await fs.access(p5DtsPath).then(() => true).catch(() => false);

    expect(globalExists).toBe(true);
    expect(p5Exists).toBe(true);

    // Now downgrade to 1.x, passing previous version
    await downloadTypeDefinitions(
      "1.9.0",      // newVersion (1.x)
      tmpDir,
      null,
      null,
      "2.1.0"       // previousVersion (2.x)
    );

    // Verify old 2.x p5.d.ts was removed
    p5Exists = await fs.access(p5DtsPath).then(() => true).catch(() => false);
    expect(p5Exists).toBe(false);

    // Verify new 1.x global.d.ts exists with correct content
    globalExists = await fs.access(globalDtsPath).then(() => true).catch(() => false);
    expect(globalExists).toBe(true);

    const content = await fs.readFile(globalDtsPath, "utf-8");
    expect(content).toContain('import * as p5Global from "p5/global"');
  });

  it("does not clear types folder when upgrading from 1.x to 2.x", async () => {
    // First, set up 1.x types
    await downloadTypeDefinitions("1.9.0", tmpDir, null, null);

    const globalDtsPath = path.join(tmpDir, "global.d.ts");
    const content1x = await fs.readFile(globalDtsPath, "utf-8");

    // Mock fetch for 2.x types
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => "// p5.js 2.x types",
    });

    // Upgrade to 2.x
    await downloadTypeDefinitions(
      "2.1.0",      // newVersion (2.x)
      tmpDir,
      null,
      null,
      "1.9.0"       // previousVersion (1.x)
    );

    // Verify 2.x types were added
    const p5DtsPath = path.join(tmpDir, "p5.d.ts");
    const p5Exists = await fs.access(p5DtsPath).then(() => true).catch(() => false);
    expect(p5Exists).toBe(true);

    // Verify global.d.ts was updated (no longer contains 1.x content)
    const content2x = await fs.readFile(globalDtsPath, "utf-8");
    expect(content2x).not.toBe(content1x);
    expect(content2x).toBe("// p5.js 2.x types");
  });

  it("does not clear types folder when updating within same major version", async () => {
    // Mock fetch
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => "// p5.js 2.x types",
    });

    // Set up 2.0.2 types
    await downloadTypeDefinitions("2.0.2", tmpDir, null, null);

    const globalDtsPath = path.join(tmpDir, "global.d.ts");
    const p5DtsPath = path.join(tmpDir, "p5.d.ts");

    // Verify both files exist
    let globalExists = await fs.access(globalDtsPath).then(() => true).catch(() => false);
    let p5Exists = await fs.access(p5DtsPath).then(() => true).catch(() => false);
    expect(globalExists).toBe(true);
    expect(p5Exists).toBe(true);

    // Update to 2.1.0 (same major version)
    await downloadTypeDefinitions(
      "2.1.0",      // newVersion
      tmpDir,
      null,
      null,
      "2.0.2"       // previousVersion
    );

    // Both files should still exist
    globalExists = await fs.access(globalDtsPath).then(() => true).catch(() => false);
    p5Exists = await fs.access(p5DtsPath).then(() => true).catch(() => false);
    expect(globalExists).toBe(true);
    expect(p5Exists).toBe(true);
  });
});

describe("downloadTypeDefinitions error handling", () => {
  it("throws error when download fails for p5.js 2.x", async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
    });

    await expect(
      downloadTypeDefinitions("2.1.0", tmpDir, null, null)
    ).rejects.toThrow("Failed to download");
  });

  it("throws error with network failure message", async () => {
    globalThis.fetch = async () => {
      const error = new Error("fetch failed");
      error.code = "ENOTFOUND";
      throw error;
    };

    await expect(
      downloadTypeDefinitions("2.1.0", tmpDir, null, null)
    ).rejects.toThrow("Unable to download TypeScript definitions");
  });
});
