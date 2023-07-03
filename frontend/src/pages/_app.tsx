/*
  eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import '@/scss/global.scss';
import '@/scss/tailwind.scss';
import '@/utils/setupDayjsPlugins';

import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { appWithTranslation } from 'next-i18next';
import { ComponentType, ReactNode } from 'react';

import { ApplicationProvider } from '@/components/ApplicationProvider';
import { AppLoader } from '@/components/AppLoader';
import { Layout } from '@/components/Layout';
import { PageMetadata } from '@/components/PageMetadata';
import { PROD } from '@/constants/env';
import { usePageTransitions } from '@/hooks';
import { FeatureFlagMap, useInitFeatureFlags } from '@/store/featureFlags';
import { hubspotStore } from '@/store/hubspot';

type GetLayoutComponent = ComponentType & {
  getLayout?(page: ReactNode): ReactNode;
};

function App({ Component, pageProps }: AppProps) {
  const { loading, nextUrl } = usePageTransitions();
  const router = useRouter();

  const featureFlags = pageProps.featureFlags as FeatureFlagMap | undefined;
  useInitFeatureFlags(featureFlags);

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

  // Use loader if page is loading and next page has a loader component.
  let loader: ReactNode;
  const isLoading = loading && (loader = <AppLoader nextUrl={nextUrl} />);
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
        <link
          rel="canonical"
          href={`https://www.napari-hub.org${router.asPath.split('?')[0]}`}
        />

        {/*
          Disable indexing for non-production deployments.
          https://developers.google.com/search/docs/advanced/crawling/block-indexing
        */}
        {(!PROD || process.env.PREVIEW) && (
          <meta name="robots" content="noindex" />
        )}
      </Head>

      <Script
        onLoad={() => {
          hubspotStore.ready = true;
        }}
        src="//js.hsforms.net/forms/v2.js?pre=1"
      />

      <ApplicationProvider dehydratedState={pageProps.dehydratedState}>
        {page}
      </ApplicationProvider>
    </>
  );
}

export default appWithTranslation(App);
