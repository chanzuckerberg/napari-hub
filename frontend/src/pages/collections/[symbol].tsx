import axios from 'axios';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { ParsedUrlQuery } from 'querystring';
import { z } from 'zod';

import { CollectionPage } from '@/components/CollectionPage';
import { CollectionContextProvider } from '@/components/CollectionPage/context';
import { ErrorMessage } from '@/components/ErrorMessage';
import { PageMetadata } from '@/components/PageMetadata';
import { useLoadingState } from '@/context/loading';
import { CollectionData } from '@/types/collections';
import { createUrl } from '@/utils';
import { hubAPI } from '@/utils/HubAPIClient';
import { getServerSidePropsHandler } from '@/utils/ssr';
import { getZodErrorMessage } from '@/utils/validate';

interface Props {
  collection?: CollectionData;
  error?: string;
}

interface Params extends ParsedUrlQuery {
  symbol: string;
}

export const getServerSideProps = getServerSidePropsHandler<Props, Params>({
  locales: ['homePage', 'pluginData', 'collections'],
  /**
   * Fetches i18n and collections API data from the backend for SSR.
   */
  async getProps({ req, params }, featureFlags) {
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
      const symbol = String(params?.symbol);
      props.collection = await hubAPI.getCollection(symbol);
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
      <PageMetadata
        description={collection?.summary}
        title={collection?.title}
        url={
          collection
            ? createUrl(
                `/collections/${collection.symbol}`,
                process.env.FRONTEND_URL,
              ).href
            : undefined
        }
        image={collection?.cover_image}
        twitterUser={curatorTwitter}
      />

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
