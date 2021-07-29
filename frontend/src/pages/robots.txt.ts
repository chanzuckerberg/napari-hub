import { GetServerSideProps } from 'next';

import { Logger } from '@/utils';

const logger = new Logger('robots.txt.ts');

/**
 * Renders the `robots.txt` file using the url `/robots.txt`. This is
 * implemented outside of `pages/api` so that the URL can be located at the root
 * of the URL.
 */
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const { default: generateRobotsTxt } = await import('generate-robotstxt');

    const host = process.env.FRONTEND_URL;
    const robotsTxt = await generateRobotsTxt({
      host,
      sitemap: `${host}/sitemap.xml`,
      policy: [
        {
          userAgent: '*',
          allow: '/',
        },
      ],
    });

    res.setHeader('Content-Type', 'text/plain');
    res.write(robotsTxt);
    res.end();
  } catch (err) {
    logger.error('Unable to fetch plugin list:', err);
  }

  return { props: {} };
};

// Default export to prevent next.js errors
export default function serverRobotsTxt(): void {}
