/*
  eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import '@/axios';
import '@/tailwind.scss';
import '@/fonts.scss';
import '@/global.scss';

import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ComponentType, ReactNode } from 'react';

import { Layout } from '@/components';
import { PageMetadata } from '@/components/common';
import { ApplicationProvider } from '@/components/common/providers';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { LoadingStateProvider } from '@/context/loading';
import { PROD } from '@/env';
import { usePageTransitions } from '@/hooks';
import SearchPage from '@/pages/index';
import PluginPage from '@/pages/plugins/[name]';
import { isPluginPage, isSearchPage } from '@/utils';

type GetLayoutComponent = ComponentType & {
  getLayout?(page: ReactNode): ReactNode;
};

export default function App({ Component, pageProps }: AppProps) {
  const { loading, nextUrl } = usePageTransitions();
  const router = useRouter();

  /**
   * Render using custom layout if component exports one:
   * https://adamwathan.me/2019/10/17/persistent-layout-patterns-in-nextjs/
   */
  function withLayout(
    node: ReactNode,
    { getLayout }: GetLayoutComponent = Component,
  ) {
    return getLayout?.(node) ?? <Layout>{node}</Layout>;
  }

  /**
   * Renders the appropriate loader component for a specific page.
   */
  function getLoaderComponent() {
    const searchPageLoader = isSearchPage(nextUrl) && (
      <LoadingStateProvider loading key="/">
        <SearchPage index={[]} licenses={[]} />
      </LoadingStateProvider>
    );

    const pluginPageLoader = isPluginPage(nextUrl) && (
      <Layout key="/plugins">
        <LoadingStateProvider loading>
          <PluginPage plugin={DEFAULT_PLUGIN_DATA} repo={DEFAULT_REPO_DATA} />
        </LoadingStateProvider>
      </Layout>
    );

    const loaders = [searchPageLoader, pluginPageLoader];

    if (!loaders.some(Boolean)) {
      return null;
    }

    return loaders;
  }

  // Use loader if page is loading and next page has a loader component.
  let loader: ReactNode;
  const isLoading = loading && (loader = getLoaderComponent());
  const page = isLoading ? loader : withLayout(<Component {...pageProps} />);

  return (
    <>
      <Head>
        {
          // The plugin page has plugin specific content that needs to be added
          // to the Page Metadata, so skip adding it here in `_app.tsx` so that
          // the data can be fetched by the plugin page.
          !router.pathname.includes('/plugins/') && (
            <PageMetadata pathname={router.pathname} />
          )
        }

        {/*
          Disable indexing for non-production deployments.
          https://developers.google.com/search/docs/advanced/crawling/block-indexing
        */}
        {!PROD && <meta name="robots" content="noindex" />}

        {
          // Preload Barlow fonts. See fonts.scss for more info.
          ['regular', '600', '700'].map((size) => (
            <link
              key={size}
              rel="preload"
              as="font"
              type="font/woff2"
              href={`/fonts/barlow-v5-latin-${size}.woff2`}
              crossOrigin=""
            />
          ))
        }
      </Head>

      <ApplicationProvider dehydratedState={pageProps.dehydratedState}>
        {page}
      </ApplicationProvider>
    </>
  );
}
