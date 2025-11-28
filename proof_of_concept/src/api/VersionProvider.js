// VersionProvider - Handles version fetching from jsdelivr API
export class VersionProvider {
  /**
   * Creates a new VersionProvider instance
   * @param {string} [packageName='p5'] - The npm package name to fetch versions for
   */
  constructor(packageName = 'p5') {
    this.packageName = packageName;
    this.baseUrl = 'https://data.jsdelivr.com/v1/package/npm';
  }

  /**
   * Gets all available versions for the configured package
   * @returns {Promise<string[]>} Array of version strings
   */
  async getVersions() {
    const response = await fetch(`${this.baseUrl}/${this.packageName}`);
    const data = await response.json();
    return data.versions;
  }

  /**
   * Gets the latest version for the configured package
   * @returns {Promise<string>} The latest version string
   */
  async getLatest() {
    const response = await fetch(`${this.baseUrl}/${this.packageName}`);
    const data = await response.json();
    return data.tags.latest;
  }

  /**
   * Gets all available versions for a specific package (useful for @types/p5)
   * @param {string} packageName - The npm package name to fetch versions for
   * @returns {Promise<string[]>} Array of version strings
   */
  async getVersionsForPackage(packageName) {
    const response = await fetch(`${this.baseUrl}/${packageName}`);
    const data = await response.json();
    return data.versions;
  }

  /**
   * Gets the latest version for a specific package
   * @param {string} packageName - The npm package name to fetch the latest version for
   * @returns {Promise<string>} The latest version string
   */
  async getLatestForPackage(packageName) {
    const response = await fetch(`${this.baseUrl}/${packageName}`);
    const data = await response.json();
    return data.tags.latest;
  }
}

