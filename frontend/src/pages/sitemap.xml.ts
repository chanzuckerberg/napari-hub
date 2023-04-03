import { GetServerSideProps } from 'next';

import { getSitemapEntries } from '@/utils/sitemap.server';

/**
 * @returns XML string for the dynamic sitemap
 */
async function renderSiteMap(): Promise<string> {
  const { SitemapStream, streamToPromise } = await import('sitemap');

  const entries = await getSitemapEntries();
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
