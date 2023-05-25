import axios from 'axios';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { z } from 'zod';

import { CollectionsPage } from '@/components/CollectionsPage';
import { CollectionsContextProvider } from '@/components/CollectionsPage/context';
import { ErrorMessage } from '@/components/ErrorMessage';
import { CollectionIndexData } from '@/types/collections';
import { hubAPI } from '@/utils/HubAPIClient';
import { getServerSidePropsHandler } from '@/utils/ssr';
import { getZodErrorMessage } from '@/utils/validate';

interface Props {
  collections?: CollectionIndexData[];
  error?: string;
}

export const getServerSideProps = getServerSidePropsHandler<Props>({
  /**
   * Fetches i18n and collections API data from the backend for SSR.
   */
  async getProps({ req }, featureFlags) {
    if (!req.url || featureFlags.collections.value !== 'on') {
      return {
        redirect: {
          permanent: false,
          source: req.url,
          destination: '/',
        },
      };
    }

    const props: Props = {};

    try {
      props.collections = await hubAPI.getCollectionsIndex();
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

export default function Collections({ collections, error }: Props) {
  const [t] = useTranslation(['pageTitles', 'collections']);

  return (
    <>
      <Head>
        <title>{t('pageTitles:collections')}</title>
      </Head>

      {error ? (
        <ErrorMessage error={error}>
          {t('collections:collectionsPage.fetchError')}
        </ErrorMessage>
      ) : (
        collections && (
          <CollectionsContextProvider collections={collections}>
            <CollectionsPage />
          </CollectionsContextProvider>
        )
      )}
    </>
  );
}
