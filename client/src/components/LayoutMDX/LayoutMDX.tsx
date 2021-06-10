import { ReactNode } from 'react';

import { ColumnLayout, TableOfContents, TOCHeader } from '@/components/common';
import { Media } from '@/components/common/media';

import { useHeaders } from './LayoutMDX.hooks';

interface Props {
  toc?: boolean;
  children: ReactNode;
}

export function LayoutMDX({ toc, children }: Props) {
  const headers: TOCHeader[] = useHeaders();

  return (
    <ColumnLayout className="p-6 md:p-12 screen-1150:px-0">
      <article className="markdown prose col-span-2 screen-875:col-span-3 screen-1425:col-start-2">
        {children}
      </article>
      {toc && (
        <Media greaterThanOrEqual="screen-1150">
          <TableOfContents headers={headers} />
        </Media>
      )}
    </ColumnLayout>
  );
}
