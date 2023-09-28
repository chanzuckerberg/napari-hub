import Head from 'next/head';
import { useTranslation } from 'next-i18next';

import { ErrorMessage } from '@/components/ErrorMessage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { SearchPage } from '@/components/SearchPage';
import { SearchStoreProvider } from '@/store/search/context';
import { SpdxLicenseData, SpdxLicenseResponse } from '@/store/search/types';
import { PluginIndexData } from '@/types';
import { Logger } from '@/utils';
import { getErrorMessage } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';
import { spdxLicenseDataAPI } from '@/utils/spdx';
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
    const props: Props = {
      status: 200,
    };

    try {
      const index = await hubAPI.getPluginIndex();
      props.index = index;
    } catch (err) {
      props.error = getErrorMessage(err);

      logger.error({
        message: 'Failed to plugin index',
        error: props.error,
      });
    }

    try {
      const {
        data: { licenses },
      } = await spdxLicenseDataAPI.get<SpdxLicenseResponse>('');
      props.licenses = licenses;
    } catch (err) {
      props.error = getErrorMessage(err);

      logger.error({
        message: 'Failed to fetch spdx license data',
        error: props.error,
      });
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
