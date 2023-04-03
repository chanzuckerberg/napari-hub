// Fine to use array index because order is fixed
/* eslint-disable react/no-array-index-key */

import Skeleton from '@mui/material/Skeleton';
import clsx from 'clsx';
import { Fragment } from 'react';

import { useMediaQuery } from '@/hooks';
import { SitemapCategory } from '@/types/sitemap';

interface SitemapLoaderColumnProps {
  count: number;
}

function SitemapLoaderColumn({ count }: SitemapLoaderColumnProps) {
  return (
    <div className="flex flex-col gap-sds-m">
      {Array.from(Array(count)).map((_, idx) => (
        <Skeleton
          key={`loader-column-${idx}`}
          className="h-5"
          variant="rectangular"
        />
      ))}
    </div>
  );
}

interface Props {
  category: SitemapCategory;
}

const LOADER_COLUMN_COUNT: Record<SitemapCategory, number> = {
  [SitemapCategory.Home]: 3,
  [SitemapCategory.Collection]: 10,
  [SitemapCategory.Plugin]: 15,
};

export function SitemapLoader({ category }: Props) {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const isScreen875 = useMediaQuery({ minWidth: 'screen-875' });

  const loader = <SitemapLoaderColumn count={LOADER_COLUMN_COUNT[category]} />;
  const loaders = [loader, isScreen600 && loader, isScreen875 && loader];

  return (
    <div
      className={clsx(
        'justify-center',
        'grid screen-600:grid-cols-napari-2 screen-600:gap-x-12',
        'screen-875:grid-cols-napari-3',
      )}
    >
      {loaders.map((currentLoader, idx) => (
        <Fragment key={`loader-${idx}`}>{currentLoader}</Fragment>
      ))}
    </div>
  );
}
