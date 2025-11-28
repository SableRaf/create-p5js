// ConfigManager - Handles project configuration
import { access } from 'fs/promises';

const basePath = 'sketch/';

export class ConfigManager {
  /**
   * Creates a new ConfigManager instance
   * @param {FileManager} fileManager - The file manager instance for file operations
   * @param {string} [configPath='sketch/p5-config.json'] - Path to the configuration file
   */
  constructor(fileManager, configPath = `${basePath}p5-config.json`) {
    this.fileManager = fileManager;
    this.configPath = configPath;
  }

  /**
   * Loads configuration from file
   * @returns {Promise<Object|null>} The configuration object with {version, mode, typeDefsVersion, lastUpdated} or null if config doesn't exist
   */
  async load() {
    try {
      await access(this.configPath);
      return await this.fileManager.readJSON(this.configPath);
    } catch (error) {
      // Config doesn't exist
      return null;
    }
  }

  /**
   * Saves configuration to file
   * @param {string} version - The p5.js version to save
   * @param {string} [mode='cdn'] - The delivery mode: "cdn" or "local"
   * @param {string|null} [typeDefsVersion=null] - The version of type definitions downloaded
   * @returns {Promise<void>}
   */
  async save(version, mode = 'cdn', typeDefsVersion = null) {
    const config = {
      version,
      mode,
      typeDefsVersion,
      lastUpdated: new Date().toISOString()
    };

    await this.fileManager.writeJSON(this.configPath, config);
  }

  /**
   * Gets the default configuration object
   * @returns {Object} Default configuration with {version: 'latest', mode: 'cdn', typeDefsVersion: null, lastUpdated: ISO timestamp}
   */
  getDefault() {
    return {
      version: 'latest',
      mode: 'cdn',
      typeDefsVersion: null,
      lastUpdated: new Date().toISOString()
    };
  }
}

