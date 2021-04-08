/*
  eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
*/

import '@/tailwind.scss';

import { AppProps } from 'next/app';
import { ReactNode, useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Hydrate } from 'react-query/hydration';

import { AppHead, Layout } from '@/components';

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
  return (
    <>
      <AppHead />

      <ReactQueryProvider dehydratedState={pageProps.dehydratedState}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ReactQueryProvider>
    </>
  );
}
