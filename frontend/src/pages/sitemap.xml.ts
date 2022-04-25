import { GetServerSideProps } from 'next';

import { PluginIndexData } from '@/types';
import { Logger } from '@/utils';
import { hubAPI } from '@/utils/axios';
import { getPreRenderManifest } from '@/utils/next';

const logger = new Logger('sitemap.xml.ts');

/**
 * This interface only includes a subset of the sitemap options. The entire
 * interface can be found here: https://git.io/JBBxu
 */
interface SitemapEntry {
  /**
   * The URL to be crawled by the search engine.
   */
  url: string;

  /**
   * The last time this page was modified. This is an optional field and is used
   * by Google if available.
   */
  lastmod?: string;
}

// URLs to exclude from the sitemap.xml file.
const HUB_URL_IGNORE_PATTERNS = [
  // Next.js internal pages
  /\/_app|_error|next/,

  // sitemap.xml and robots.txt files
  /\/sitemap\.xml|robots\.txt/,

  // Plugin pages
  /\/plugins\/\[name\]/,

  // Plugin preview page
  /\/preview/,

  // Error pages
  /\/404|500/,

  // MDX pages
  /\/\[\.\.\.parts\]/,
];

/**
 * @returns a list of non-plugin page hub sitemap entries.
 */
async function getHubEntries(): Promise<SitemapEntry[]> {
  const { getBuildManifest } = await import('@/utils/next');

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
        .map((url) => ({ url })),
    );

    return entries;
  } catch (err) {
    logger.error('Unable to read Next.js build manifest:', err);
  }

  return [];
}

/**
 * @returns A list of all hub plugin sitemap entries using the plugin index API.
 */
async function getPluginEntries(): Promise<SitemapEntry[]> {
  try {
    const { data } = await hubAPI.get<PluginIndexData[]>('/plugins/index');

    return data.map((plugin) => {
      const url = `/plugins/${plugin.name}`;
      const lastmod = new Date(plugin.release_date).toISOString();

      return {
        url,
        lastmod,
      };
    });
  } catch (err) {
    logger.error('Unable to fetch plugin list:', err);
  }

  return [];
}

/**
 * @returns XML string for the dynamic sitemap
 */
async function renderSiteMap(): Promise<string> {
  const { SitemapStream, streamToPromise } = await import('sitemap');

  const entries: SitemapEntry[] = (
    await Promise.all([getHubEntries(), getPluginEntries()])
  ).flat();

  const stream = new SitemapStream({ hostname: process.env.FRONTEND_URL });
  entries.forEach((entry) => stream.write(entry));
  stream.end();
  const result = await streamToPromise(stream);

  return result.toString();
}

/**
 * Renders the `sitemap.xml` file using the url `/sitemap.xml`. This is
 * implemented outside of `pages/api` so that the URL can be located at the root
 * of the URL.
 */
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemapXml = await renderSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemapXml);
  res.end();

  return {
    props: {},
  };
};

// Default export to prevent next.js errors
export default function serverSitemap(): void {}
