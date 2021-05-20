import clsx from 'clsx';

import { useSearchState } from '@/context/search';

import { PluginSearchResult } from './PluginSearchResult';

export function PluginSearchResultList() {
  const { results = [] } = useSearchState() ?? {};

  return (
    <>
      <h3
        className={clsx(
          'col-span-2',
          'font-bold text-2xl mb-6',
          'screen-875:col-start-2',
        )}
      >
        Browse plugins
      </h3>

      {results.map(({ plugin }) => (
        <PluginSearchResult
          className={clsx(
            'col-span-2',
            'screen-875:col-start-2 screen-875:col-span-2',
            'screen-1425:col-start-2 screen-1425:col-span-3',
          )}
          key={plugin.name}
          plugin={plugin}
        />
      ))}
    </>
  );
}
