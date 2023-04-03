import { SitemapCategory, SitemapEntry } from '@/types/sitemap';
import { getPluginFirstLetter } from '@/utils/sitemap';

import { SitemapEntryListItem } from './SitemapEntryListItem';

interface Props {
  category: SitemapCategory;
  entries: SitemapEntry[];
}

export function SitemapEntryList({ category, entries }: Props) {
  return (
    <div className="mt-sds-l screen-600:gap-x-12 screen-600:columns-2 screen-875:columns-3">
      {entries.map((entry, idx) => (
        <SitemapEntryListItem
          key={entry.url}
          category={category}
          entry={entry}
          showPluginLetterHeader={
            // Is first item in list
            idx === 0 ||
            // The previous entry does not match current entry's first letter
            (idx - 1 > 0 &&
              getPluginFirstLetter(entries[idx - 1]) !==
                getPluginFirstLetter(entry))
          }
        />
      ))}
    </div>
  );
}
