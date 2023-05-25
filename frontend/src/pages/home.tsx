import axios from 'axios';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';
import { z } from 'zod';

import { ErrorMessage } from '@/components/ErrorMessage';
import {
  HomePage,
  HomePageLayout,
  HomePageProvider,
} from '@/components/HomePage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { PluginSectionsResponse, PluginSectionType } from '@/types';
import { hubAPI } from '@/utils/HubAPIClient';
import { getServerSidePropsHandler } from '@/utils/ssr';
import { getZodErrorMessage } from '@/utils/validate';

interface Props {
  status: number;
  pluginSections?: PluginSectionsResponse;
  error?: string;
}

export const getServerSideProps = getServerSidePropsHandler<Props>({
  locales: ['homePage', 'pluginData'],
  async getProps({ req }, featureFlags) {
    const props: Props = {
      status: 200,
    };

    if (!req.url || featureFlags.collections.value !== 'on') {
      props.status = 404;
      return { props };
    }

    try {
      props.pluginSections = await hubAPI.getPluginSections([
        PluginSectionType.pluginType,
        PluginSectionType.newest,
        PluginSectionType.recentlyUpdated,
        PluginSectionType.topInstalls,
      ]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        props.error = err.message;
      }

      if (err instanceof z.ZodError) {
        props.error = getZodErrorMessage(err);
      }
    }

    return { props };
  },
});

/**
 * Temporary route for home page for development
 * TODO move this file to `index.tsx`
 */
export default function Home({ pluginSections, error, status }: Props) {
  const [t] = useTranslation(['pageTitles', 'homePage']);

  if (status === 404) {
    return <NotFoundPage />;
  }

  if (error || !pluginSections) {
    return (
      <ErrorMessage error={error}>{t('homePage:fetchError')}</ErrorMessage>
    );
  }

  return (
    <HomePageProvider pluginSections={pluginSections}>
      <HomePage />
    </HomePageProvider>
  );
}

Home.getLayout = (page: ReactNode) => <HomePageLayout>{page}</HomePageLayout>;
