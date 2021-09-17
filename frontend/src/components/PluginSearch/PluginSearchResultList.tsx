import clsx from 'clsx';
import { useSnapshot } from 'valtio';

import { ColumnLayout, SkeletonLoader } from '@/components/common';
import { useLoadingState } from '@/context/loading';
import { searchResultsStore } from '@/store/search/results.store';
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

function SearchResultCount() {
  const { results } = useSnapshot(searchResultsStore);

  return (
    <SkeletonLoader
      className="ml-2 w-6 inline-block"
      render={() => results.length}
    />
  );
}

function SearchResultItems() {
  const { results } = useSnapshot(searchResultsStore);
  const isLoading = useLoadingState();
  const searchResults = isLoading ? getSkeletonResults() : results;

  return (
    <>
      {searchResults.map(({ plugin, matches }) => (
        <PluginSearchResult
          className="col-span-2 screen-1425:col-span-3"
          key={plugin.name}
          plugin={plugin}
          matches={matches}
        />
      ))}
    </>
  );
}

export function PluginSearchResultList() {
  return (
    <section className="col-span-2 screen-1425:col-span-3">
      <h3 className={clsx('flex items-center font-bold text-xl')}>
        Browse plugins: <SearchResultCount />
      </h3>

      <FilterChips className="my-5" />

      <ColumnLayout
        classes={{
          threeColumn: '',
          fiveColumn: '',
          fourColumn: '',
          gap: 'gap-x-6 md:gap-x-12',
        }}
      >
        <SearchResultItems />
      </ColumnLayout>
    </section>
  );
}
