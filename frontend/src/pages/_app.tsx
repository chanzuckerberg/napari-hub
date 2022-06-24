/*
  eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import '@/scss/global.scss';
import '@/scss/tailwind.scss';
import '@/utils/axios';

import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { appWithTranslation } from 'next-i18next';
import { ComponentType, ReactNode } from 'react';

import { ApplicationProvider } from '@/components/ApplicationProvider';
import { Layout } from '@/components/Layout';
import { PageMetadata } from '@/components/PageMetadata';
import { PROD } from '@/constants/env';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { LoadingStateProvider } from '@/context/loading';
import { usePageTransitions } from '@/hooks';
import SearchPage from '@/pages/index';
import PluginPage from '@/pages/plugins/[name]';
import { isPluginPage, isSearchPage } from '@/utils';

type GetLayoutComponent = ComponentType & {
  getLayout?(page: ReactNode): ReactNode;
};

function App({ Component, pageProps }: AppProps) {
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
      {
        // The plugin page has plugin specific content that needs to be added
        // to the Page Metadata, so skip adding it here in `_app.tsx` so that
        // the data can be fetched by the plugin page.
        !/\/preview|plugins|(collections\/.*)/.exec(router.pathname) && (
          <PageMetadata />
        )
      }

      <Head>
        {/*
          Disable indexing for non-production deployments.
          https://developers.google.com/search/docs/advanced/crawling/block-indexing
        */}
        {(!PROD || process.env.PREVIEW) && (
          <meta name="robots" content="noindex" />
        )}
      </Head>

      <ApplicationProvider dehydratedState={pageProps.dehydratedState}>
        {page}
      </ApplicationProvider>
    </>
  );
}

export default appWithTranslation(App);
