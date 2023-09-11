/**
 * Includes util functionality that should only be called on the server side of
 * the application. This is required because some of the fetchers for entries
 * depend on modules that are not available on the browser.
 */

import { SitemapCategory, SitemapEntry } from '@/types/sitemap';
import { createUrl, Logger } from '@/utils';
import { hubAPI } from '@/utils/HubAPIClient';
import { getBuildManifest, getPreRenderManifest } from '@/utils/next';

import { getErrorMessage } from './error';

const logger = new Logger('sitemap.ts');

// URLs to exclude from the sitemap.xml file.
const HUB_URL_IGNORE_PATTERNS = [
  // Next.js internal pages
  /\/_app|_error|next/,

  // sitemap.xml and robots.txt files
  /\/sitemap\.xml|robots\.txt/,

  // Plugin pages
  /\/plugins\/\[name\]/,

  // Error pages
  /\/404|500/,

  // MDX pages
  /\/\[\.\.\.parts\]/,
];

/**
 * @returns a list of non-plugin page hub sitemap entries.
 */
function getHubEntries(): SitemapEntry[] {
  try {
    const buildManifest = getBuildManifest();
    const preRenderManifest = getPreRenderManifest();

    const entries: SitemapEntry[] = [];
    const entryUrls = [
      ...Object.keys(buildManifest?.pages ?? {}),
      ...Object.keys(preRenderManifest?.routes ?? {}),
    ];

    entries.push(
      ...entryUrls
        .filter(
          (url) =>
            !HUB_URL_IGNORE_PATTERNS.some((pattern) => pattern.exec(url)),
        )
        .map((url) => url.replace('/en/', '/'))
        .map((url) => ({ url, type: SitemapCategory.Home })),
    );

    return entries;
  } catch (err) {
    logger.error({
      message: 'Unable to read Next.js build manifest',
      error: getErrorMessage(err),
    });
  }

  return [];
}

/**
 * @returns A list of all hub plugin sitemap entries using the plugin index API.
 */
async function getPluginEntries(): Promise<SitemapEntry[]> {
  try {
    const data = await hubAPI.getPluginIndex();

    return data.map((plugin) => {
      const url = `/plugins/${plugin.name}`;
      const lastmod = new Date(plugin.release_date).toISOString();

      return {
        url,
        lastmod,
        name: plugin.display_name ?? plugin.name,
        type: SitemapCategory.Plugin,
      };
    });
  } catch (err) {
    logger.error({
      message: 'Unable to fetch plugin list',
      error: getErrorMessage(err),
    });
  }

  return [];
}

export async function getSitemapEntries({
  hostname,
}: {
  hostname?: string;
} = {}): Promise<SitemapEntry[]> {
  return (await Promise.all([getHubEntries(), getPluginEntries()]))
    .flat()
    .map((entry) => ({
      ...entry,
      url: hostname ? createUrl(entry.url, hostname).href : entry.url,
    }));
}
