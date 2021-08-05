import { GetServerSideProps } from 'next';

import { hubAPI } from '@/axios';
import { Logger } from '@/utils';

const logger = new Logger('sitemap.xml.ts');

/**
 * This interface only includes a subset of the sitemap options. The entire
 * interface can be found here: https://git.io/JBBxu
 */
interface SitemapEntry {
  url: string;
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
}

function getEntry(url: string): SitemapEntry {
  return {
    url,
    changefreq: 'daily',
    priority: 0.7,
  };
}

const HUB_URL_IGNORE_REGEX = /\/(_app|_error|next|sitemap.xml|robots.txt|plugins\/\[name\])/;

/**
 * @returns a list of non-plugin page hub sitemap entries.
 */
async function getHubEntries() {
  const { getBuildManifest } = await import('@/utils/next');

  try {
    const manifest = getBuildManifest();

    if (manifest) {
      return Object.keys(manifest.pages)
        .filter((url) => !HUB_URL_IGNORE_REGEX.exec(url))
        .map(getEntry);
    }
  } catch (err) {
    logger.error('Unable to read Next.js build manifest:', err);
  }

  return [];
}

/**
 * @returns A list of all hub plugin sitemap entries using the plugin versions API.
 */
async function getPluginEntries() {
  try {
    const url = '/plugins';
    const { data } = await hubAPI.get<Record<string, string>>(url);
    return Object.keys(data)
      .map((name) => `/plugins/${name}`)
      .map(getEntry);
  } catch (err) {
    logger.error('Unable to fetch plugin list:', err);
  }

  return [];
}

/**
 * @returns XML string for the dynamic sitemap
 */
async function renderSiteMap() {
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
