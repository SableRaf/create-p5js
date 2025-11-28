// FileManager - Handles all file system operations
import { readFile, writeFile, mkdir, access, rm, readdir } from 'fs/promises';
import { constants } from 'fs';

const basePath = 'sketch/';

export class FileManager {
  /**
   * Reads HTML file content from the specified path
   * @param {string} [path='sketch/index.html'] - The path to the HTML file
   * @returns {Promise<string>} The file content as a string
   */
  async readHTML(path = `${basePath}index.html`) {
    return await readFile(path, 'utf-8');
  }

  /**
   * Writes HTML content to the specified path
   * @param {string} [path='sketch/index.html'] - The path where the file should be written
   * @param {string} content - The HTML content to write
   * @returns {Promise<void>}
   */
  async writeHTML(path = `${basePath}index.html`, content) {
    await writeFile(path, content, 'utf-8');
  }

  /**
   * Creates a directory recursively (creates parent directories if needed)
   * @param {string} path - The directory path to create
   * @returns {Promise<void>}
   */
  async createDir(path) {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      // Directory already exists, ignore
    }
  }

  /**
   * Checks if a file or directory exists at the specified path
   * @param {string} path - The path to check
   * @returns {Promise<boolean>} True if the path exists, false otherwise
   */
  async exists(path) {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Lists the contents of a directory (file and folder names)
   * @param {string} path - The directory path to list
   * @returns {Promise<string[]>} Array of file/folder names, or empty array if directory doesn't exist
   */
  async listDir(path) {
    try {
      return await readdir(path);
    } catch (err) {
      return [];
    }
  }

  /**
   * Deletes a file at the specified path
   * @param {string} path - The file path to delete
   * @returns {Promise<boolean>} True if deletion succeeded, false otherwise
   */
  async deleteFile(path) {
    try {
      await rm(path, { force: true });
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Deletes a directory and all its contents recursively
   * @param {string} path - The directory path to delete
   * @returns {Promise<boolean>} True if deletion succeeded, false otherwise
   */
  async deleteDir(path) {
    try {
      await rm(path, { recursive: true, force: true });
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Downloads a file from a URL and saves it to the specified path
   * @param {string} url - The URL to download from
   * @param {string} targetPath - The local path where the file should be saved
   * @returns {Promise<string>} The downloaded content as a string
   */
  async downloadFile(url, targetPath) {
    const response = await fetch(url);
    const content = await response.text();
    await writeFile(targetPath, content, 'utf-8');
    return content;
  }

  /**
   * Downloads a file from a URL and returns the response with status check
   * @param {string} url - The URL to download from
   * @returns {Promise<{ok: boolean, text: Function}>} Object with ok status and text() method to get content
   */
  async downloadFileWithCheck(url) {
    const response = await fetch(url);
    return {
      ok: response.ok,
      text: async () => await response.text()
    };
  }

  /**
   * Writes a JavaScript object as formatted JSON to a file
   * @param {string} path - The file path to write to
   * @param {Object} data - The data object to serialize as JSON
   * @returns {Promise<void>}
   */
  async writeJSON(path, data) {
    await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Reads and parses a JSON file
   * @param {string} path - The JSON file path to read
   * @returns {Promise<Object>} The parsed JSON object
   */
  async readJSON(path) {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  }
}

