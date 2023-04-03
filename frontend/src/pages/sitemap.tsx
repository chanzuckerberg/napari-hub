import Head from 'next/head';
import { useTranslation } from 'next-i18next';

import { SitemapPage } from '@/components/SitemapPage';
import { SitemapEntry } from '@/types/sitemap';
import { getSitemapEntries } from '@/utils/sitemap.server';
import { getServerSidePropsHandler } from '@/utils/ssr';

interface Props {
  entries: SitemapEntry[];
}

export const getServerSideProps = getServerSidePropsHandler<Props>({
  // Include home page and plugin page locales for page transition loading states
  locales: ['homePage', 'pluginPage'],

  async getProps() {
    return {
      props: {
        entries: await getSitemapEntries({
          hostname: process.env.FRONTEND_URL,
        }),
      },
    };
  },
});

export default function Sitemap({ entries }: Props) {
  const [t] = useTranslation(['pageTitles']);

  return (
    <>
      <Head>
        <title>{t('pageTitles:sitemap')}</title>
      </Head>

      <SitemapPage entries={entries} />
    </>
  );
}
