import ServerStyleSheets from '@material-ui/styles/ServerStyleSheets';
import clsx from 'clsx';
import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

import { mediaStyles } from '@/components/media';
import { theme } from '@/theme';

const FAVICON = `${process.env.BASE_PATH || ''}/icons/favicon`;

export default class HubDocument extends Document {
  static async getInitialProps(context: DocumentContext) {
    // Render app and page and get the context of the page with collected side effects.
    const sheets = new ServerStyleSheets();
    const originalRenderPage = context.renderPage;

    context.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
      });

    const initialProps = await Document.getInitialProps(context);

    return {
      ...initialProps,

      // Add Material UI SSR stylesheet in `head` so that they load before
      // application styles. This ensures any application styles overriding
      // Material UI gets correctly applied. This prevents the style flashing
      // from Material UI base styles to overridden styles
      head: [<>{initialProps.head}</>, sheets.getStyleElement()],
    };
  }

  render() {
    const isPreview = !!process.env.PREVIEW;

    return (
      <Html className={clsx(isPreview && 'preview')} lang="en">
        <Head>
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href={`${FAVICON}/apple-touch-icon.png`}
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href={`${FAVICON}/favicon-32x32.png`}
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href={`${FAVICON}/favicon-16x16.png`}
          />
          <link rel="manifest" href={`${FAVICON}/site.webmanifest`} />
          <link
            rel="mask-icon"
            href={`${FAVICON}/safari-pinned-tab.svg`}
            color="#009bf2"
          />
          <meta name="msapplication-TileColor" content="#009bf2" />

          <style
            type="text/css"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: mediaStyles }}
          />

          {/*
            Fonts are optimized using Next.js:
            https://nextjs.org/docs/basic-features/font-optimization
          */}
          <link
            href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap"
            rel="stylesheet"
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
