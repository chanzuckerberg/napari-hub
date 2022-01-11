import Head from 'next/head';
import { useRouter } from 'next/router';

import { createUrl } from '@/utils';

import { usePageMetadata } from './usePageMetadata';

interface Props {
  description?: string;
  keywords?: string[];
}

/**
 * Renders meta tags for the current page. If keywords are provided, they'll be
 * appended to the keyword list used for the page. If a description is provided,
 * it's used instead of the configured value.
 */
export function PageMetadata({ description, keywords }: Props) {
  const router = useRouter();
  const { pathname } = createUrl(router.asPath);
  const metadata = usePageMetadata(pathname);

  return (
    <Head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />

      {metadata && (
        <>
          <meta
            name="keywords"
            content={(
              keywords?.concat(metadata.keywords) ?? metadata.keywords
            ).join(', ')}
          />

          <meta
            name="description"
            content={description || metadata.description}
          />
        </>
      )}
    </Head>
  );
}
