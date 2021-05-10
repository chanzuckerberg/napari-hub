/*
  eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import '@/axios';
import '@/tailwind.scss';
import '@/global.scss';

import { AppProps } from 'next/app';
import Head from 'next/head';
import { ReactNode, useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Hydrate } from 'react-query/hydration';

import { Layout } from '@/components';
import { MediaContextProvider } from '@/components/common/media';

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

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <ReactQueryProvider dehydratedState={pageProps.dehydratedState}>
        <MediaContextProvider>{page}</MediaContextProvider>
      </ReactQueryProvider>
    </>
  );
}
