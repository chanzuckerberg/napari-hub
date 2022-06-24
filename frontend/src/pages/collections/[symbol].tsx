import { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { SSRConfig, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ParsedUrlQuery } from 'querystring';

import { CollectionPage } from '@/components/CollectionPage';
import { CollectionContextProvider } from '@/components/CollectionPage/context';
import { ErrorMessage } from '@/components/ErrorMessage';
import { PageMetadata } from '@/components/PageMetadata';
import { useLoadingState } from '@/context/loading';
import { CollectionData } from '@/types/collections';
import { I18nNamespace } from '@/types/i18n';
import { hubAPI } from '@/utils/axios';
import { isFeatureFlagEnabled } from '@/utils/featureFlags';

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
  req,
  params,
  locale,
}: GetServerSidePropsContext<Params>) {
  if (!req.url || !isFeatureFlagEnabled('collections', req.url)) {
    return {
      redirect: {
        permanent: false,
        source: req.url,
        destination: '/',
      },
    };
  }

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

  const curatorTwitter = /https:\/\/twitter.com\/([\w]+)/.exec(
    collection?.curator.links?.twitter ?? '',
  )?.[1];

  return (
    <>
      <PageMetadata description={collection?.summary} />

      <Head>
        <title>{title}</title>

        {collection && (
          <>
            <meta property="og:title" content={collection.title} />
            <meta property="og:type" content="article" />
            <meta
              property="og:url"
              content={`https://napari-hub.org/collections/${collection.title}`}
            />
            <meta property="og:image" content={collection.cover_image} />
            <meta property="og:description" content={collection.summary} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@napari_imaging" />
            <meta name="twitter:title" content={collection.title} />
            <meta name="twitter:description" content={collection.summary} />
            <meta name="twitter:image" content={collection.cover_image} />
            {curatorTwitter && (
              <meta name="twitter:creator" content={`@${curatorTwitter}`} />
            )}
          </>
        )}
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
