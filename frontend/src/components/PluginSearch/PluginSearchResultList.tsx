import clsx from 'clsx';
import { useSnapshot } from 'valtio';

import { ColumnLayout, SkeletonLoader } from '@/components/common';
import { RESULTS_PER_PAGE } from '@/constants/search';
import { useLoadingState } from '@/context/loading';
import { loadingStore } from '@/store/loading';
import { searchResultsStore } from '@/store/search/results.store';
import { SearchResult } from '@/store/search/search.types';
import { PluginIndexData } from '@/types';

import { FilterChips } from './FilterChips';
import { PluginSearchResult } from './PluginSearchResult';

/**
 * Returns an array of fake search results for loading purposes.
 *
 * @param count The number of results to render.
 *
 */
function getSkeletonResults(count: number) {
  const resultLength = count > 0 ? count : RESULTS_PER_PAGE;

  return [...Array<SearchResult>(resultLength)].map((_, idx) => ({
    matches: {},
    index: 0,
    plugin: { name: `fake-plugin-${idx}` } as PluginIndexData,
  }));
}

function SearchResultCount() {
  const {
    results: { totalPlugins },
  } = useSnapshot(searchResultsStore);

  return (
    <SkeletonLoader
      className="ml-2 w-6 inline-block"
      render={() => totalPlugins}
    />
  );
}

function SearchResultItems() {
  const {
    results: { paginatedResults },
  } = useSnapshot(searchResultsStore);
  const {
    skeleton: { resultHeights },
  } = useSnapshot(loadingStore);
  const isLoading = useLoadingState();
  const searchResults = isLoading
    ? getSkeletonResults(resultHeights.length)
    : paginatedResults;

  return (
    <>
      {searchResults.map(({ plugin, matches }, index) => (
        <PluginSearchResult
          className="col-span-2 screen-1425:col-span-3"
          key={plugin.name}
          plugin={plugin}
          matches={matches}
          style={
            isLoading && resultHeights[index]
              ? { height: `${resultHeights[index]}px` }
              : {}
          }
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
