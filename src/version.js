/**
 * Fetches available p5.js versions from jsdelivr CDN API
 * @returns {Promise<{ latest: string, versions: string[] }>} Object containing latest version and array of up to 15 most recent versions
 */
export async function fetchVersions() {
  const apiUrl = 'https://data.jsdelivr.com/v1/package/npm/p5';

  const response = await fetch(apiUrl);
  const data = await response.json();

  const latest = data.tags.latest;
  const versions = data.versions.slice(0, 15); // Limit to 15 most recent

  return { latest, versions };
}
