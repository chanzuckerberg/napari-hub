import { Fragment } from 'react';

import { Link } from '@/components/Link';
import { Text } from '@/components/Text';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SitemapCategory, SitemapEntry } from '@/types/sitemap';
import { getPluginFirstLetter } from '@/utils/sitemap';

import { useLabelForSitemapEntry } from './useLabelForSitemapEntry ';

interface Props {
  category: SitemapCategory;
  entry: SitemapEntry;
  showPluginLetterHeader?: boolean;
}

export function SitemapEntryListItem({
  category,
  entry,
  showPluginLetterHeader,
}: Props) {
  const label = useLabelForSitemapEntry(entry);
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });

  return (
    <Fragment key={entry.url}>
      {showPluginLetterHeader && category === SitemapCategory.Plugin && (
        <Text
          className="mb-sds-m screen-600:mt-sds-xxl first:screen-600:mt-0"
          variant="h3"
        >
          {getPluginFirstLetter(entry)}
        </Text>
      )}

      <Text variant={isScreen600 ? 'bodyM' : 'bodyS'}>
        <Link className="underline block mb-sds-m" href={entry.url}>
          {label}
        </Link>
      </Text>
    </Fragment>
  );
}
