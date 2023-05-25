import axios from 'axios';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';
import { z } from 'zod';

import { ErrorMessage } from '@/components/ErrorMessage';
import { HomePage, HomePageProvider } from '@/components/HomePage';
import { SearchPage } from '@/components/SearchPage';
import { SearchStoreProvider } from '@/store/search/context';
import { SpdxLicenseData, SpdxLicenseResponse } from '@/store/search/types';
import {
  PluginIndexData,
  PluginSectionsResponse,
  PluginSectionType,
} from '@/types';
import { hubAPI } from '@/utils/HubAPIClient';
import { spdxLicenseDataAPI } from '@/utils/spdx';
import { getServerSidePropsHandler } from '@/utils/ssr';
import { getZodErrorMessage } from '@/utils/validate';

interface Props {
  error?: string;
  index?: PluginIndexData[];
  licenses?: SpdxLicenseData[];
  pluginSections?: PluginSectionsResponse;
}

export const getServerSideProps = getServerSidePropsHandler<Props>({
  locales: ['homePage', 'pluginData'],
  async getProps(_, featureFlags) {
    const props: Props = {};

    try {
      if (featureFlags.homePageRedesign.value === 'on') {
        props.pluginSections = await hubAPI.getPluginSections([
          PluginSectionType.pluginType,
          PluginSectionType.newest,
          PluginSectionType.recentlyUpdated,
          PluginSectionType.topInstalls,
        ]);
      } else {
        const index = await hubAPI.getPluginIndex();
        const {
          data: { licenses },
        } = await spdxLicenseDataAPI.get<SpdxLicenseResponse>('');

        Object.assign(props, { index, licenses });
      }
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

export default function Home({
  error,
  index,
  licenses,
  pluginSections,
}: Props) {
  const [t] = useTranslation(['pageTitles', 'homePage']);

  return (
    <>
      <Head>
        <title>{t('pageTitles:home')}</title>
      </Head>

      {error && (
        <ErrorMessage error={error}>{t('homePage:fetchError')}</ErrorMessage>
      )}

      {index && licenses && (
        <SearchStoreProvider index={index} licenses={licenses}>
          <SearchPage />
        </SearchStoreProvider>
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
