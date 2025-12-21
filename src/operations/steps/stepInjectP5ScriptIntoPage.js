import fs from 'fs/promises';
import path from 'node:path';
import { injectP5Script } from '../../htmlManager.js';
/** @typedef {import('../../types.js').CliArgs} CliArgs */
/** @typedef {import('../../types.js').DeliveryMode} DeliveryMode */
/** @typedef {import('../../types.js').Language} Language */
/** @typedef {import('../../types.js').P5Mode} P5Mode */
/** @typedef {import('../../types.js').SetupType} SetupType */

/**
 * 
 * @param {string} targetPath 
 * @param {string} selectedVersion 
 * @param {DeliveryMode} selectedDeliveryMode 
 */
export async function stepInjectP5ScriptIntoPage(targetPath, selectedVersion, selectedDeliveryMode) {
  const indexPath = path.join(targetPath, 'index.html');
  const htmlContent = await fs.readFile(indexPath, 'utf-8');
  const updatedHtml = injectP5Script(htmlContent, selectedVersion, selectedDeliveryMode);
  await fs.writeFile(indexPath, updatedHtml, 'utf-8');
}
