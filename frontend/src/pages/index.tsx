import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

import { ErrorMessage } from '@/components/ErrorMessage';
import { HomePage, HomePageProvider } from '@/components/HomePage';
import { PluginSectionsResponse, PluginSectionType } from '@/types';
import { Logger } from '@/utils';
import { getErrorMessage } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';
import { getServerSidePropsHandler } from '@/utils/ssr';

interface Props {
  error?: string;
  pluginSections?: PluginSectionsResponse;
}

const logger = new Logger('pages/index.ts');

export const getServerSideProps = getServerSidePropsHandler<Props>({
  async getProps() {
    const props: Props = {};

    try {
      props.pluginSections = await hubAPI.getPluginSections([
        PluginSectionType.pluginType,
        PluginSectionType.newest,
        PluginSectionType.recentlyUpdated,
      ]);
    } catch (err) {
      props.error = getErrorMessage(err);

      logger.error({
        message: 'Failed to fetch plugin sections',
        error: props.error,
      });
    }

    return { props };
  },
});

export default function Home({ error, pluginSections }: Props) {
  const [t] = useTranslation(['pageTitles', 'homePage']);

  return (
    <>
      <Head>
        <title>{t('pageTitles:home')}</title>
      </Head>

      {error && (
        <ErrorMessage error={error}>{t('homePage:fetchError')}</ErrorMessage>
      )}

      {pluginSections && (
        <HomePageProvider pluginSections={pluginSections}>
          <HomePage />
        </HomePageProvider>
      )}
    </>
  );
}

// Return page by itself so we can show modified home page layout.
Home.getLayout = (page: ReactNode) => page;
