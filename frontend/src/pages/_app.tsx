/*
  eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import '@/axios';
import '@/tailwind.scss';
import '@/fonts.scss';
import '@/global.scss';

import { StylesProvider, ThemeProvider } from '@material-ui/styles';
import { AppProps } from 'next/app';
import Head from 'next/head';
import NextPlausibleProvider from 'next-plausible';
import { ComponentType, ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Hydrate } from 'react-query/hydration';

import { Layout } from '@/components';
import { MediaContextProvider } from '@/components/common/media';
import { LoadingStateProvider } from '@/context/loading';
import { PROD, STAGING } from '@/env';
import { usePageTransitions } from '@/hooks';
import SearchPage from '@/pages/index';
import PluginPage from '@/pages/plugins/[name]';
import { theme } from '@/theme';
import { PluginData } from '@/types';
import { isPluginPage, isSearchPage } from '@/utils';

type GetLayoutComponent = ComponentType & {
  getLayout?(page: ReactNode): ReactNode;
};

interface QueryProviderProps {
  children: ReactNode;
  dehydratedState: unknown;
}

function ReactQueryProvider({ children, dehydratedState }: QueryProviderProps) {
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Hydrate state={dehydratedState}>
        {children}
        <ReactQueryDevtools />
      </Hydrate>
    </QueryClientProvider>
  );
}

interface ProviderProps {
  children: ReactNode;
}

function MaterialUIProvider({ children }: ProviderProps) {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    jssStyles?.parentElement?.removeChild?.(jssStyles);
  }, []);

  return (
    <MediaContextProvider>
      <ThemeProvider theme={theme}>
        <StylesProvider
          // By default, Material UI will inject styles at the bottom of the
          // body so that it has higher priority over other CSS rules. This
          // makes it harder to override CSS, so we use `injectFirst` to
          // inject styles in the head element instead:
          // https://material-ui.com/styles/advanced/#injectfirst
          injectFirst
        >
          {children}
        </StylesProvider>
      </ThemeProvider>
    </MediaContextProvider>
  );
}

function PlausibleProvider({ children }: ProviderProps) {
  const isUsingPlausible = process.env.PLAUSIBLE === 'true';
  if (!isUsingPlausible) {
    return <>{children}</>;
  }

  // Plausible doesn't actually do any domain checking, so the domain is used
  // mostly an ID for which Plausible dashboard we want to send data to.
  // https://github.com/plausible/analytics/discussions/183
  const domain = PROD ? 'napari-hub.org' : 'dev.napari-hub.org';
  return (
    <NextPlausibleProvider domain={domain} enabled trackOutboundLinks>
      {children}
    </NextPlausibleProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const { loading, nextUrl } = usePageTransitions();

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
      <Layout>
        <LoadingStateProvider loading key="/plugins">
          <PluginPage plugin={{} as PluginData} />
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
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        {/*
          Disable indexing for non-prod and non-staging deployments.
          https://developers.google.com/search/docs/advanced/crawling/block-indexing
        */}
        {!PROD && !STAGING && <meta name="robots" content="noindex" />}

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

      <ReactQueryProvider dehydratedState={pageProps.dehydratedState}>
        <MediaContextProvider>
          <MaterialUIProvider>
            <PlausibleProvider>{page}</PlausibleProvider>
          </MaterialUIProvider>
        </MediaContextProvider>
      </ReactQueryProvider>
    </>
  );
}
