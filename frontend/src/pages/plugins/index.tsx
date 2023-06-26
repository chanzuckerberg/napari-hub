import axios from 'axios';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { z } from 'zod';

import { ErrorMessage } from '@/components/ErrorMessage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { SearchPage } from '@/components/SearchPage';
import { SearchStoreProvider } from '@/store/search/context';
import { SpdxLicenseData, SpdxLicenseResponse } from '@/store/search/types';
import { PluginIndexData } from '@/types';
import { hubAPI } from '@/utils/HubAPIClient';
import { spdxLicenseDataAPI } from '@/utils/spdx';
import { getServerSidePropsHandler } from '@/utils/ssr';
import { getZodErrorMessage } from '@/utils/validate';

interface Props {
  error?: string;
  index?: PluginIndexData[];
  licenses?: SpdxLicenseData[];
  status?: number;
}

export const getServerSideProps = getServerSidePropsHandler<Props>({
  async getProps({ req }, featureFlags) {
    const props: Props = {
      status: 200,
    };

    if (!req.url || featureFlags.homePageRedesign.value !== 'on') {
      props.status = 404;
    } else {
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
    }

    return { props };
  },
});

export default function Plugins({
  error,
  index = [],
  licenses = [],
  status = 200,
}: Props) {
  const [t] = useTranslation(['pageTitles', 'homePage']);

  if (status === 404) {
    return <NotFoundPage />;
  }

  return (
    <>
      <Head>
        <title>{t('pageTitles:plugins')}</title>
      </Head>

      {error ? (
        <ErrorMessage error={error}>{t('homePage:fetchError')}</ErrorMessage>
      ) : (
        <SearchStoreProvider index={index} licenses={licenses}>
          <SearchPage />
        </SearchStoreProvider>
      )}
    </>
  );
}
