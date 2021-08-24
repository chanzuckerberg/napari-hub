import clsx from 'clsx';
import { useAtom } from 'jotai';
import { isEmpty } from 'lodash';

import { ColumnLayout, SkeletonLoader } from '@/components/common';
import { loadingState } from '@/store/loading';
import { filterChipState } from '@/store/search/filter.state';
import { searchResultsState } from '@/store/search/results.state';
import { SearchResult } from '@/store/search/search.types';
import { PluginIndexData } from '@/types';
import { getSkeletonResultCount } from '@/utils';

import { FilterChips } from './FilterChips';
import { PluginSearchResult } from './PluginSearchResult';

/**
 * Returns a constant array of fake search results for loading purposes.
 */
function getSkeletonResults() {
  const count = getSkeletonResultCount();
  return [...Array<SearchResult>(count)].map((_, idx) => ({
    matches: {},
    index: 0,
    plugin: { name: `fake-plugin-${idx}` } as PluginIndexData,
  }));
}

export function PluginSearchResultList() {
  const [isLoading] = useAtom(loadingState);
  const [results] = useAtom(searchResultsState);
  const [filterChips] = useAtom(filterChipState);
  const searchResults = isLoading ? getSkeletonResults() : results;

  return (
    <section className="col-span-2 screen-1425:col-span-3">
      <h3
        className={clsx(
          'flex items-center font-bold text-xl',
          isEmpty(filterChips) && 'mb-5',
        )}
      >
        Browse plugins:{' '}
        <SkeletonLoader
          className="ml-2 w-6 inline-block"
          render={() => results.length}
        />
      </h3>

      <FilterChips className="my-5 h-6" />

      <ColumnLayout
        classes={{
          threeColumn: '',
          fiveColumn: '',
          fourColumn: '',
          gap: 'gap-x-6 md:gap-x-12',
        }}
      >
        {searchResults.map(({ plugin, matches }) => (
          <PluginSearchResult
            className="col-span-2 screen-1425:col-span-3"
            key={plugin.name}
            plugin={plugin}
            matches={matches}
          />
        ))}
      </ColumnLayout>
    </section>
  );
}
