import clsx from 'clsx';
import Head from 'next/head';
import { ReactNode } from 'react';

import { ColumnLayout } from '@/components/ColumnLayout';
import styles from '@/components/Markdown/Markdown.module.scss';
import syntaxHighlightingStyles from '@/components/Markdown/SyntaxHighlighter.module.scss';
import { Media } from '@/components/media';
import { TableOfContents, TOCHeader } from '@/components/TableOfContents';

import { useHeaders } from './LayoutMDX.hooks';

interface Props {
  toc?: boolean;
  title: string;
  children: ReactNode;
}

export function LayoutMDX({ toc, title, children }: Props) {
  const headers: TOCHeader[] = useHeaders();

  return (
    <>
      <Head>
        <title>napari hub | {title}</title>
      </Head>

      <ColumnLayout className="p-6 md:p-12 screen-1150:px-0">
        <article
          className={clsx(
            styles.markdown,
            syntaxHighlightingStyles.code,
            'col-span-2',
            'screen-875:col-span-3',
            'screen-1425:col-start-2',
          )}
        >
          {children}
        </article>
        {toc && (
          <Media greaterThanOrEqual="screen-1150">
            <TableOfContents headers={headers} />
          </Media>
        )}
      </ColumnLayout>
    </>
  );
}
