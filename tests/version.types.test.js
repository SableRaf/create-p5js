import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import {
  downloadTypeDefinitions,
  parseVersion,
  getTypesStrategy,
  findClosestVersion,
  findExactMinorMatch,
  fetchTypesVersions,
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

describe("findClosestVersion", () => {
  describe("basic functionality", () => {
    const availableVersions = [
      "1.3.0",
      "1.4.2",
      "1.4.3",
      "1.5.0",
      "1.7.6",
      "1.7.7",
    ];

    it("returns exact match if it exists", () => {
      const result = findClosestVersion("1.4.2", availableVersions);
      expect(result).toBe("1.4.2");
    });

    it("returns null when no matching major version", () => {
      const result = findClosestVersion("2.0.0", availableVersions);
      expect(result).toBeNull();
    });

    it("handles single available version", () => {
      const result = findClosestVersion("1.4.0", ["1.7.7"]);
      expect(result).toBe("1.7.7");
    });
  });

  describe("same minor version matching (Rule 3)", () => {
    it("picks closest by patch distance when same minor exists", () => {
      const versions = ["1.7.2", "1.7.10"];
      const result = findClosestVersion("1.7.9", versions);
      expect(result).toBe("1.7.10"); // Distance 1 vs 7
    });

    it("picks higher patch when distances are equal", () => {
      const versions = ["1.7.5", "1.7.9"];
      const result = findClosestVersion("1.7.7", versions);
      expect(result).toBe("1.7.9"); // Both distance 2, pick higher
    });

    it("works with multiple same-minor candidates", () => {
      const versions = ["1.4.0", "1.4.2", "1.4.3", "1.4.10"];
      const result = findClosestVersion("1.4.5", versions);
      expect(result).toBe("1.4.3"); // Distance 2 (vs 0:5, 2:3, 3:2, 10:5)
    });

    it("ignores other minor versions when same minor exists", () => {
      const versions = ["1.6.5", "1.7.2", "1.7.3", "1.8.1"];
      const result = findClosestVersion("1.7.9", versions);
      expect(result).toBe("1.7.3"); // Only considers 1.7.x versions
    });
  });

  describe("different minor version matching (Rule 4)", () => {
    it("uses flattened distance when no same minor", () => {
      const versions = ["1.6.5", "1.8.1"];
      const result = findClosestVersion("1.7.9", versions);
      // Target: 179, candidates: 165 (distance 14), 181 (distance 2)
      expect(result).toBe("1.8.1");
    });

    it("picks higher version when flattened distances are equal", () => {
      const versions = ["1.5.8", "1.9.0"];
      const result = findClosestVersion("1.7.4", versions);
      // Target: 174, candidates: 158 (distance 16), 190 (distance 16)
      expect(result).toBe("1.9.0"); // Same distance, pick higher
    });

    it("handles complex flattened comparisons", () => {
      const versions = ["1.5.0", "1.9.0"];
      const result = findClosestVersion("1.7.0", versions);
      // Target: 170, candidates: 150 (distance 20), 190 (distance 20)
      expect(result).toBe("1.9.0"); // Same distance, pick higher
    });

    it("works across different minor versions", () => {
      const versions = ["1.3.0", "1.5.0", "1.9.0"];
      const result = findClosestVersion("1.6.0", versions);
      // Target: 160, candidates: 130 (30), 150 (10), 190 (30)
      expect(result).toBe("1.5.0"); // Smallest distance
    });
  });

  describe("edge cases", () => {
    it("handles versions with double-digit minor/patch", () => {
      const versions = ["1.10.2", "1.11.5"];
      const result = findClosestVersion("1.10.0", versions);
      // Same minor exists (1.10), should pick 1.10.2
      expect(result).toBe("1.10.2");
    });

    it("handles flattening with double-digit numbers correctly", () => {
      const versions = ["1.9.9", "1.10.1"];
      const result = findClosestVersion("1.10.0", versions);
      // Target has same minor as 1.10.1
      expect(result).toBe("1.10.1");
    });

    it("prefers same minor over closer flattened distance", () => {
      const versions = ["1.6.9", "1.7.0", "1.8.0"];
      const result = findClosestVersion("1.7.5", versions);
      // 1.7.0 is same minor (should win even though 1.6.9 might be closer flattened)
      expect(result).toBe("1.7.0");
    });

    it("skips invalid version strings in available list", () => {
      const versions = ["1.7.2", "invalid", "1.8.1"];
      const result = findClosestVersion("1.7.9", versions);
      expect(result).toBe("1.7.2");
    });

    it("ignores prerelease versions in available list", () => {
      const versions = ["1.7.2", "1.8.0-rc.1", "1.8.1"];
      const result = findClosestVersion("1.7.9", versions);
      expect(result).toBe("1.7.2");
    });
  });

  describe("test cases from specification", () => {
    it("spec example 1: target 1.7.9 with [1.6.5, 1.8.1]", () => {
      const result = findClosestVersion("1.7.9", ["1.6.5", "1.8.1"]);
      expect(result).toBe("1.8.1");
    });

    it("spec example 2: target 1.7.9 with [1.7.2, 1.7.10]", () => {
      const result = findClosestVersion("1.7.9", ["1.7.2", "1.7.10"]);
      expect(result).toBe("1.7.10");
    });
  });
});

describe("findExactMinorMatch", () => {
  const availableVersions = [
    "1.3.0",
    "1.4.2",
    "1.4.3",
    "1.5.0",
    "1.7.6",
    "1.7.7",
  ];

  it("finds exact major.minor match with highest patch", () => {
    const result = findExactMinorMatch("1.4.0", availableVersions);
    expect(result).toBe("1.4.2"); // Next available is 1.4.2
  });

  it("returns null when no exact major.minor match exists", () => {
    const result = findExactMinorMatch("1.6.0", availableVersions);
    expect(result).toBeNull(); // No 1.6.x available
  });

  it("returns null when no matching major version", () => {
    const result = findExactMinorMatch("2.0.0", availableVersions);
    expect(result).toBeNull();
  });

  it("works with single matching version", () => {
    const result = findExactMinorMatch("1.7.6", availableVersions);
    expect(result).toBe("1.7.6"); // Exact match (distance = 0)
  });
});

describe("getTypesStrategy", () => {
  it("uses @types/p5 for version 1.x", () => {
    const strategy = getTypesStrategy("1.9.0");
    expect(strategy.useTypesPackage).toBe(true);
    expect(strategy.reason).toContain("1.x uses @types/p5");
  });

  it("uses bundled types for version 2.0.0", () => {
    const strategy = getTypesStrategy("2.0.0");
    expect(strategy.useTypesPackage).toBe(false);
    expect(strategy.reason).toContain("2.x has bundled types");
  });

  it("uses bundled types for version 2.0.1", () => {
    const strategy = getTypesStrategy("2.0.1");
    expect(strategy.useTypesPackage).toBe(false);
  });

  it("uses bundled types for version 2.1.1", () => {
    const strategy = getTypesStrategy("2.1.1");
    expect(strategy.useTypesPackage).toBe(false);
  });

  it("uses bundled types for future versions (3.x+)", () => {
    const strategy = getTypesStrategy("3.0.0");
    expect(strategy.useTypesPackage).toBe(false);
  });
});

describe("fetchTypesVersions", () => {
  it("fetches @types/p5 versions successfully", async () => {
    globalThis.fetch = async (url) => {
      if (url.includes("@types/p5")) {
        return {
          ok: true,
          json: async () => ({
            versions: ["1.7.7", "1.7.6", "1.5.0", "1.4.2"],
          }),
        };
      }
    };

    const versions = await fetchTypesVersions();
    expect(versions).toEqual(["1.7.7", "1.7.6", "1.5.0", "1.4.2"]);
  });

  it("throws error on network failure", async () => {
    globalThis.fetch = async () => {
      throw new Error("fetch failed");
    };

    await expect(fetchTypesVersions()).rejects.toThrow(
      "Unable to reach jsdelivr CDN API",
    );
  });
});

describe("downloadTypeDefinitions for p5.js 1.x", () => {
  it("downloads from closest matching @types/p5 version for 1.4.0", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const actual = await downloadTypeDefinitions(
      "1.4.0",      // p5Version
      "1.4.2",      // typesVersion (closest to 1.4.0 in available versions 1.4.2, 1.4.3)
      tmpDir,       // targetDir
      null,         // spinner
      null,         // template (global mode, downloads both files)
    );
    expect(actual).toBe("1.4.2"); // Returns the types version downloaded

    // Verify files downloaded from correct version
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/@types/p5@1.4.2/global.d.ts",
    );
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/@types/p5@1.4.2/index.d.ts",
    );
  });

  it("downloads from closest available version when exact minor not found", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const actual = await downloadTypeDefinitions(
      "1.9.0",      // p5Version
      "1.7.7",      // typesVersion (closest to 1.9.0 when no 1.9.x available)
      tmpDir,       // targetDir
      null,         // spinner
      null,         // template (global mode)
    );
    expect(actual).toBe("1.7.7"); // Returns the types version downloaded

    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/global.d.ts",
    );
  });

  it("downloads only index.d.ts for instance mode", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    await downloadTypeDefinitions(
      "1.9.0",      // p5Version
      "1.7.7",      // typesVersion
      tmpDir,       // targetDir
      null,         // spinner
      "instance"    // template (instance mode)
    );

    // Should only download index.d.ts for instance mode
    const typesFetches = fetchedUrls.filter(
      (url) => url.includes("@types/p5@") && url.endsWith(".d.ts"),
    );
    expect(typesFetches).toHaveLength(1);
    expect(typesFetches[0]).toContain("index.d.ts");
  });
});

describe("downloadTypeDefinitions for p5.js 2.x", () => {
  it("downloads bundled types for version 2.1.1 (exact match)", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const actual = await downloadTypeDefinitions(
      "2.1.1",      // p5Version
      "2.1.1",      // typesVersion (same for bundled types)
      tmpDir,       // targetDir
      null,         // spinner
      null,         // template (global mode)
    );
    expect(actual).toBe("2.1.1"); // Returns the types version downloaded

    // Verify bundled types URLs
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/p5@2.1.1/types/global.d.ts",
    );
    expect(fetchedUrls).toContain(
      "https://cdn.jsdelivr.net/npm/p5@2.1.1/types/p5.d.ts",
    );
  });

  it("falls back to closest 2.x version for 2.0.0 (no bundled types)", async () => {
    const fetchedUrls = [];

    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const actual = await downloadTypeDefinitions(
      "2.0.0",      // p5Version
      "2.0.2",      // typesVersion (fallback from resolveTypesVersion)
      tmpDir,       // targetDir
      null,         // spinner
      null,         // template (global mode)
    );
    expect(actual).toBe("2.0.2"); // Returns the types version downloaded

    // Verify fallback to 2.0.2
    expect(
      fetchedUrls.some((url) => url.includes("p5@2.0.2/types/global.d.ts")),
    ).toBe(true);
  });

  it("falls back to closest 2.x version for 2.0.1 (no bundled types)", async () => {
    const fetchedUrls = [];

    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);

      return {
        ok: true,
        text: async () => "// dummy types",
      };
    };

    const actual = await downloadTypeDefinitions(
      "2.0.1",      // p5Version
      "2.0.2",      // typesVersion (fallback from resolveTypesVersion)
      tmpDir,       // targetDir
      null,         // spinner
      null,         // template (global mode)
    );
    expect(actual).toBe("2.0.2"); // Returns the types version downloaded

    expect(
      fetchedUrls.some((url) => url.includes("p5@2.0.2/types/global.d.ts")),
    ).toBe(true);
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
      "2.1.1",      // p5Version
      "2.1.1",      // typesVersion
      tmpDir,       // targetDir
      null,         // spinner
      "instance"    // template (instance mode)
    );

    // Should only download p5.d.ts for instance mode
    const typesFetches = fetchedUrls.filter(
      (url) => url.includes("p5@2.1.1/types/") && url.endsWith(".d.ts"),
    );
    expect(typesFetches).toHaveLength(1);
    expect(typesFetches[0]).toContain("p5.d.ts");
  });
});

describe("downloadTypeDefinitions error handling", () => {
  it("throws error on network failure", async () => {
    globalThis.fetch = async () => {
      return { ok: false, status: 500 };
    };

    await expect(
      downloadTypeDefinitions(
        "1.9.0",      // p5Version
        "1.7.7",      // typesVersion
        tmpDir,       // targetDir
        null,         // spinner
        null          // template
      ),
    ).rejects.toThrow("Failed to download");
  });

  it("throws error when file response is not ok", async () => {
    globalThis.fetch = async () => {
      return { ok: false, status: 404 };
    };

    await expect(
      downloadTypeDefinitions(
        "1.9.0",      // p5Version
        "1.7.7",      // typesVersion
        tmpDir,       // targetDir
        null,         // spinner
        null          // template
      ),
    ).rejects.toThrow("Failed to download");
  });
});
