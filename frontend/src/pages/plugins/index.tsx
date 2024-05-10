import Head from 'next/head';
import { useTranslation } from 'next-i18next';

import { ErrorMessage } from '@/components/ErrorMessage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { SearchPage } from '@/components/SearchPage';
import { SearchStoreProvider } from '@/store/search/context';
import { SpdxLicenseData } from '@/store/search/types';
import { PluginIndexData } from '@/types';
import { Logger } from '@/utils';
import { getErrorMessage } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';
import { getSpdxProps as getSpdxLicenses } from '@/utils/spdx';
import { getServerSidePropsHandler } from '@/utils/ssr';

interface Props {
  error?: string;
  index?: PluginIndexData[];
  licenses?: SpdxLicenseData[];
  status?: number;
}

const logger = new Logger('pages/plugins/index.tsx');

export const getServerSideProps = getServerSidePropsHandler<Props>({
  async getProps() {
    let index: PluginIndexData[];

    try {
      index = await hubAPI.getPluginIndex();
    } catch (err) {
      const error = getErrorMessage(err);

      logger.error({
        message: 'Failed to plugin index',
        error,
      });

      return { props: { error } };
    }

    const licenses = await getSpdxLicenses(logger);

    return {
      props: {
        index,
        licenses,
        status: 200,
      },
    };
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
