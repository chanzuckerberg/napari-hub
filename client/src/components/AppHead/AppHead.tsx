import Head from 'next/head';

const FAVICONS = [
  {
    rel: 'apple-touch-icon',
    sizes: '57x57',
    image: 'apple-icon-57x57.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '60x60',
    image: 'apple-icon-60x60.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '72x72',
    image: 'apple-icon-72x72.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '76x76',
    image: 'apple-icon-76x76.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '114x114',
    image: 'apple-icon-114x114.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '120x120',
    image: 'apple-icon-120x120.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '144x144',
    image: 'apple-icon-144x144.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '152x152',
    image: 'apple-icon-152x152.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    image: 'apple-icon-180x180.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
    image: 'android-icon-192x192.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    image: 'favicon-32x32.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '96x96',
    image: 'favicon-96x96.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    image: 'favicon-16x16.png',
  },
];

function FaviconLinks() {
  return (
    <>
      {FAVICONS.map((data) => (
        <link key={data.image} href={`/favicon/${data.image}`} {...data} />
      ))}
    </>
  );
}

export function AppHead() {
  return (
    <Head>
      <title>napari hub</title>
      <meta
        name="description"
        content="Share your image analysis tool with researchers everywhere &mdash; No GUI development required."
      />

      <link rel="manifest" href="/manifest.json" />
      <meta name="msapplication-TileColor" content="#80d1ff" />
      <meta
        name="msapplication-TileImage"
        content="/favicon/ms-icon-144x144.png"
      />
      <meta name="theme-color" content="#80d1ff" />

      <FaviconLinks />
    </Head>
  );
}
