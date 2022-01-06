import fs from 'fs-extra';
import glob from 'glob';
import { isArray } from 'lodash';
import { GetStaticPathsResult, GetStaticPropsContext } from 'next';
import { SSRConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import path from 'path';

import { MDX } from '@/components/MDX';
import { serialize } from '@/components/MDX/serialize';
import i18nConfig from '@/next-i18next.config';
import NotFound from '@/pages/404';
import { I18nNamespace } from '@/types/i18n';

interface Props extends SSRConfig {
  mdxSource?: MDXRemoteSerializeResult;
}

const LOCALE_DIR = __dirname.replace('.next/server/pages', `src/locales`);

/**
 * Special Next.js function responsible for returning all possible paths that
 * can be built by this page at build time. Since we use `getStaticPaths()` to
 * generate the pages, every `MDX` page will be compiled to static HTML at build
 * time. This is more efficient, but requires us to explicitly define every
 * possible page that can be rendered. In this case, we're returning all
 * possible MDX pages for every supported locale.
 */
export function getStaticPaths(): GetStaticPathsResult {
  const supportedLocales = i18nConfig.i18n.locales;
  const paths: GetStaticPathsResult['paths'] = [];

  // Get all MDX files recursively so that we can supported nested pages.
  const mdxFiles = glob
    .sync(path.resolve(LOCALE_DIR, 'en', '**/*.mdx'))
    .map((file) => path.basename(file, '.mdx'));

  for (const locale of supportedLocales) {
    for (const file of mdxFiles) {
      paths.push({
        locale,
        params: {
          parts: file.split('/'),
        },
      });
    }
  }

  return {
    paths,
    fallback: false,
  };
}

/**
 * Fetches props for the `CatchAllPage` component at build time. The props
 * returned are the serialized MDX source data used for rendering the MDX page.
 */
export async function getStaticProps({
  locale = 'en',
  params = {},
}: GetStaticPropsContext) {
  const translationProps = await serverSideTranslations(locale, [
    'common',
    'footer',
  ] as I18nNamespace[]);
  const props: Partial<Props> = { ...translationProps };

  // Read and serialize MDX file for rendering if the router pathname matches an
  // MDX file in the `src/locale/{locale}` directory.
  const { parts } = params;
  if (parts && isArray(parts)) {
    const file = `${path.resolve(LOCALE_DIR, locale, ...parts)}.mdx`;

    if (await fs.pathExists(file)) {
      const mdxString = await fs.readFile(file, 'utf-8');
      props.mdxSource = await serialize(mdxString);
    }
  }

  return { props };
}

/**
 * Catch all page that handles rendering MDX pages. This works by rendering
 * matching the URL path to the file structure in `src/locales`. That way, the
 * about page in English will use the file `src/locales/en/about.mdx`, while the
 * contact page in Spanish will use `src/locales/es/contact.mdx`.
 *
 * This enables developers and non-developers to add new MDX pages to the repo
 * without having to touch code.
 */
export default function CatchAllPage({ mdxSource }: Props) {
  // If the mdx source is not found, render the 404 page. This should only
  // happen in development since `getStaticPaths()` will always return an
  // existing mdx file in production.
  if (!mdxSource) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-grow justify-center">
      <MDX mdxSource={mdxSource} />
    </div>
  );
}
