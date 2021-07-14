import clsx from 'clsx';
import { isEmpty } from 'lodash';

import { ColumnLayout, SkeletonLoader } from '@/components/common';
import { useLoadingState } from '@/context/loading';
import { SearchResult, useSearchState } from '@/context/search';
import { PluginIndexData } from '@/types';

import { FilterChips } from './FilterChips';
import { PluginSearchResult } from './PluginSearchResult';

const SKELETON_RESULT_COUNT = 8;

/**
 * Returns a constant array of fake search results for loading purposes.
 */
function getSkeletonResults() {
  return [...Array<SearchResult>(SKELETON_RESULT_COUNT)].map((_, idx) => ({
    matches: {},
    index: 0,
    plugin: { name: `fake-plugin-${idx}` } as PluginIndexData,
  }));
}

export function PluginSearchResultList() {
  const isLoading = useLoadingState();
  const { filter, results = [] } = useSearchState() ?? {};
  const searchResults = isLoading ? getSkeletonResults() : results;

  return (
    <section className="col-span-2 screen-1425:col-span-3">
      <h3
        className={clsx(
          'flex items-center font-bold text-xl',
          isEmpty(filter?.chips) && 'mb-5',
        )}
      >
        Browse plugins:{' '}
        <SkeletonLoader
          className="ml-2 w-6 inline-block"
          render={() => results.length}
        />
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
