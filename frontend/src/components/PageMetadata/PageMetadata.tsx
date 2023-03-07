/* eslint-disable react/destructuring-assignment */

import { defaults } from 'lodash';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { createUrl } from '@/utils';

import { PageMetadataProps, usePageMetadata } from './usePageMetadata';

/**
 * Renders meta tags for the current page. If keywords are provided, they'll be
 * appended to the keyword list used for the page. If a description is provided,
 * it's used instead of the configured value.
 */
export function PageMetadata(props: PageMetadataProps) {
  const router = useRouter();
  const { pathname } = createUrl(router.asPath);
  const metadata = usePageMetadata(pathname);

  const { description, image, title, twitterUser, url } = defaults(
    {},
    props,
    metadata,
  );

  const keywords = props.keywords
    ? props.keywords.concat(metadata?.keywords ?? [])
    : metadata?.keywords;

  return (
    <Head>
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1"
        key="viewport"
      />

      {keywords && (
        <meta name="keywords" content={keywords.join(', ')} key="keywords" />
      )}

      {description && (
        <>
          <meta name="description" content={description} key="description" />
          <meta
            property="og:description"
            content={description}
            key="ogDescription"
          />
          <meta
            name="twitter:description"
            content={description}
            key="twitterDescription"
          />
        </>
      )}

      {title && (
        <>
          <meta property="og:title" content={title} key="ogTitle" />
          <meta name="twitter:title" content={title} key="twitterTitle" />
        </>
      )}

      <meta property="og:type" content="article" key="ogType" />
      {url && <meta property="og:url" content={url} key="ogUrl" />}

      {image && (
        <>
          <meta property="og:image" content={image} key="ogImage" />
          <meta
            name="twitter:card"
            content="summary_large_image"
            key="twitterCard"
          />
          <meta name="twitter:image" content={image} key="twitterImage" />
        </>
      )}

      <meta name="twitter:site" content="@napari_imaging" key="twitterSite" />

      {twitterUser && (
        <meta
          name="twitter:creator"
          content={`@${twitterUser}`}
          key="twitterCreator"
        />
      )}
    </Head>
  );
}
