import { useMemo } from 'react';

import { NAPARI_PREFIX_REGEX } from '@/constants/search';
import { SitemapCategory, SitemapEntry } from '@/types/sitemap';
import { createUrl } from '@/utils';
import { getPluginFirstLetter } from '@/utils/sitemap';

function getEntryValue(entry: SitemapEntry) {
  const name = entry.name ?? entry.url.split('/').at(-1) ?? '';
  return name.toLowerCase().replace(NAPARI_PREFIX_REGEX, '');
}

function sortByNameOrUrl(entry1: SitemapEntry, entry2: SitemapEntry) {
  return getEntryValue(entry1).localeCompare(getEntryValue(entry2));
}

/**
 * Places sitemap entries into categories based on the `SitemapCategory` enum.
 * This is so we can render links in a specific group on the sitemap page.
 */
export function useCategorizedSitemapEntries(entries: SitemapEntry[]) {
  return useMemo(
    () => ({
      [SitemapCategory.Home]: entries.filter(
        (entry) =>
          entry.type === SitemapCategory.Home &&
          !['/', '/sitemap', '/collections'].includes(
            createUrl(entry.url).pathname,
          ),
      ),

      [SitemapCategory.Collection]: entries
        .filter((entry) => entry.type === SitemapCategory.Collection)
        .sort(sortByNameOrUrl),

      [SitemapCategory.Plugin]: entries
        .filter((entry) => entry.type === SitemapCategory.Plugin)
        .sort((entry1: SitemapEntry, entry2: SitemapEntry) => {
          const firstLetter1 = getPluginFirstLetter(entry1);
          const firstLetter2 = getPluginFirstLetter(entry2);

          if (firstLetter1 !== firstLetter2) {
            return firstLetter1.localeCompare(firstLetter2);
          }

          return sortByNameOrUrl(entry1, entry2);
        }),
    }),
    [entries],
  );
}
