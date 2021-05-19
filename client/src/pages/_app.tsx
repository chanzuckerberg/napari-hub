/*
  eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import '@/axios';
import '@/tailwind.scss';
import '@/global.scss';

import { StylesProvider, ThemeProvider } from '@material-ui/styles';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Hydrate } from 'react-query/hydration';

import { Layout } from '@/components';
import { MediaContextProvider } from '@/components/common/media';
import { theme } from '@/theme';

interface GetLayoutComponent {
  getLayout?(page: ReactNode): ReactNode;
}

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

export default function App({ Component, pageProps }: AppProps) {
  // Render using custom layout if component exports one:
  // https://adamwathan.me/2019/10/17/persistent-layout-patterns-in-nextjs/
  const { getLayout } = Component as GetLayoutComponent;
  let page: ReactNode = <Component {...pageProps} />;
  page = getLayout?.(page) ?? <Layout>{page}</Layout>;

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    jssStyles?.parentElement?.removeChild?.(jssStyles);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        {/* TODO Make this load async to fix render blocking */}
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <ReactQueryProvider dehydratedState={pageProps.dehydratedState}>
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
              {page}
            </StylesProvider>
          </ThemeProvider>
        </MediaContextProvider>
      </ReactQueryProvider>
    </>
  );
}
