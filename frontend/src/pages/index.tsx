import axios from 'axios';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';
import { z } from 'zod';

import { ErrorMessage } from '@/components/ErrorMessage';
import { SearchPage } from '@/components/SearchPage';
import { SearchStoreProvider } from '@/store/search/context';
import { SpdxLicenseData, SpdxLicenseResponse } from '@/store/search/types';
import { PluginIndexData } from '@/types';
import { hubAPI } from '@/utils/HubAPIClient';
import { spdxLicenseDataAPI } from '@/utils/spdx';
import { getServerSidePropsHandler } from '@/utils/ssr';
import { getZodErrorMessage } from '@/utils/validate';

interface Props {
  licenses?: SpdxLicenseData[];
  index?: PluginIndexData[];
  error?: string;
}

export const getServerSideProps = getServerSidePropsHandler<Props>({
  locales: ['homePage', 'pluginData'],
  async getProps() {
    const props: Props = {};

    try {
      const index = await hubAPI.getPluginIndex();
      const {
        data: { licenses },
      } = await spdxLicenseDataAPI.get<SpdxLicenseResponse>('');

      Object.assign(props, { index, licenses });
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

export default function Home({ error, index, licenses }: Props) {
  const [t] = useTranslation(['pageTitles', 'homePage']);

  return (
    <>
      <Head>
        <title>{t('pageTitles:home')}</title>
      </Head>

      {error ? (
        <ErrorMessage error={error}>{t('homePage:fetchError')}</ErrorMessage>
      ) : (
        index &&
        licenses && (
          <SearchStoreProvider index={index} licenses={licenses}>
            <SearchPage />
          </SearchStoreProvider>
        )
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
