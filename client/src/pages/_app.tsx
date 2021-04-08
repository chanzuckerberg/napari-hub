import { AppProps } from 'next/app';

import { AppHead, Layout } from '@/components';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <AppHead />

      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
