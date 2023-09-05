import { getSitemapEntries } from '@/utils/sitemap.server';
import { getServerSidePropsHandler } from '@/utils/ssr';

/**
 * @returns XML string for the dynamic sitemap
 */
async function renderSiteMap(filteredPages: RegExp[]): Promise<string> {
  const { SitemapStream, streamToPromise } = await import('sitemap');

  const entries = await getSitemapEntries();
  const stream = new SitemapStream({ hostname: process.env.FRONTEND_URL });
  entries
    .filter(
      (entry) => !filteredPages.some((pattern) => pattern.exec(entry.url)),
    )
    .forEach((entry) => stream.write(entry));
  stream.end();
  const result = await streamToPromise(stream);

  return result.toString();
}

/**
 * Renders the `sitemap.xml` file using the url `/sitemap.xml`. This is
 * implemented outside of `pages/api` so that the URL can be located at the root
 * of the URL.
 */
export const getServerSideProps = getServerSidePropsHandler({
  async getProps({ res }) {
    const filteredPages: RegExp[] = [];

    const sitemapXml = await renderSiteMap(filteredPages);

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemapXml);
    res.end();

    return {
      props: {},
    };
  },
});

// Default export to prevent next.js errors
export default function serverSitemap(): void {}
