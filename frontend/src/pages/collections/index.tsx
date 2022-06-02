import { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { SSRConfig, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { CollectionsPage } from '@/components/CollectionsPage';
import { CollectionsContextProvider } from '@/components/CollectionsPage/context';
import { ErrorMessage } from '@/components/ErrorMessage';
import { CollectionIndexData } from '@/types/collections';
import { I18nNamespace } from '@/types/i18n';
import { hubAPI } from '@/utils/axios';

interface Props extends Partial<SSRConfig> {
  collections?: CollectionIndexData[];
  error?: string;
}

/**
 * Fetches i18n and collections API data from the backend for SSR.
 */
export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  const translationProps = await serverSideTranslations(locale ?? 'en', [
    'common',
    'footer',
    'homePage',
    'pageTitles',
    'pluginData',
    'collections',
  ] as I18nNamespace[]);
  const props: Props = { ...translationProps };

  try {
    const { data: collections } = await hubAPI.get<CollectionIndexData[]>(
      '/collections',
    );
    props.collections = collections;
  } catch (err) {
    const error = err as AxiosError;
    props.error = error.message;
  }

  return { props };
}

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

  return <h1>yuh</h1>;
}
