import Document, { Head, Html, Main, NextScript } from 'next/document';

import { mediaStyles } from '@/components/common/media';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <style
            type="text/css"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: mediaStyles }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
