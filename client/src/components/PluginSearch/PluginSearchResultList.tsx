import clsx from 'clsx';

import { useSearchState } from '@/context/search';

import { FilterChips } from './FilterChips';
import { PluginSearchResult } from './PluginSearchResult';

export function PluginSearchResultList() {
  const { results = [] } = useSearchState() ?? {};

  return (
    <>
      <h3
        className={clsx(
          'col-span-2',
          'font-bold text-xl my-6',
          'screen-875:col-start-2',
        )}
      >
        Browse plugins
      </h3>

      <FilterChips className="col-span-2 screen-1425:col-span-3 mb-6" />

      {results.map(({ plugin, matches }) => (
        <PluginSearchResult
          className={clsx(
            'col-span-2',
            'screen-875:col-start-2 screen-875:col-span-2',
            'screen-1425:col-start-2 screen-1425:col-span-3',
          )}
          key={plugin.name}
          plugin={plugin}
          matches={matches}
        />
      ))}
    </>
  );
}
