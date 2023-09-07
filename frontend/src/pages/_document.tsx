import ServerStyleSheets from '@mui/styles/ServerStyleSheets';
import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

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
    return (
      <Html id="napari-hub" lang="en">
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

          {/*
            Fonts are optimized using Next.js:
            https://nextjs.org/docs/basic-features/font-optimization

            TODO Re-enable font optimization until it's fixed for Next.js v12.1:
            https://github.com/vercel/next.js/issues/36498
          */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=JetBrains+Mono&display=swap"
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
