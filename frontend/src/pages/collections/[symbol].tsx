import { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { SSRConfig, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ParsedUrlQuery } from 'querystring';

import { CollectionPage } from '@/components/CollectionPage';
import { CollectionContextProvider } from '@/components/CollectionPage/context';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useLoadingState } from '@/context/loading';
import { CollectionData } from '@/types/collections';
import { I18nNamespace } from '@/types/i18n';
import { hubAPI } from '@/utils/axios';

interface Props extends Partial<SSRConfig> {
  collection?: CollectionData;
  error?: string;
}

interface Params extends ParsedUrlQuery {
  symbol: string;
}

/**
 * Fetches i18n and collections API data from the backend for SSR.
 */
export async function getServerSideProps({
  params,
  locale,
}: GetServerSidePropsContext<Params>) {
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
    const symbol = String(params?.symbol);
    const { data: collection } = await hubAPI.get<CollectionData>(
      `/collections/${symbol}`,
    );
    props.collection = collection;
  } catch (err) {
    const error = err as AxiosError;
    props.error = error.message;
  }

  return { props };
}

export default function Collections({ collection, error }: Props) {
  const isLoading = useLoadingState();
  const [t] = useTranslation(['pageTitles', 'collections']);

  let title = `${t('pageTitles:collection')}`;
  if (isLoading) {
    title = `${title} | ${t('pageTitles:loading')}...`;
  } else if (collection) {
    title = `${title} | ${collection.title} by ${collection.curator.name}`;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {error ? (
        <ErrorMessage error={error}>
          {t('collections:collectionPage.fetchError')}
        </ErrorMessage>
      ) : (
        collection && (
          <CollectionContextProvider collection={collection}>
            <CollectionPage />
          </CollectionContextProvider>
        )
      )}
    </>
  );
}
