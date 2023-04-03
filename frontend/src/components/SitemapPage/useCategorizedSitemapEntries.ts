import { useMemo } from 'react';

import { SitemapCategory, SitemapEntry } from '@/types/sitemap';
import { createUrl } from '@/utils';
import { getPluginFirstLetter } from '@/utils/sitemap';

function sortByNameOrURL(entry1: SitemapEntry, entry2: SitemapEntry) {
  if (entry1.name && entry2.name) {
    return entry1.name.localeCompare(entry2.name);
  }

  return entry1.url.localeCompare(entry2.url);
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
        .sort(sortByNameOrURL),

      [SitemapCategory.Plugin]: entries
        .filter((entry) => entry.type === SitemapCategory.Plugin)
        .sort((entry1: SitemapEntry, entry2: SitemapEntry) => {
          const firstLetter1 = getPluginFirstLetter(entry1);
          const firstLetter2 = getPluginFirstLetter(entry2);

          if (firstLetter1 !== firstLetter2) {
            return firstLetter1.localeCompare(firstLetter2);
          }

          return sortByNameOrURL(entry1, entry2);
        }),
    }),
    [entries],
  );
}
