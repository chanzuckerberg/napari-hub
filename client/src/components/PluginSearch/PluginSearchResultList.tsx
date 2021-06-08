import clsx from 'clsx';
import { isEmpty } from 'lodash';

import { useSearchState } from '@/context/search';

import { ColumnLayout } from '../common';
import { FilterChips } from './FilterChips';
import { PluginSearchResult } from './PluginSearchResult';

export function PluginSearchResultList() {
  const { filter, results = [] } = useSearchState() ?? {};

  return (
    <section className="col-span-2 screen-1425:col-span-3">
      <h3
        className={clsx('font-bold text-xl', isEmpty(filter?.chips) && 'mb-5')}
      >
        Browse plugins: {results.length}
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
        {results.map(({ plugin, matches }) => (
          <PluginSearchResult
            className={clsx('col-span-2', 'screen-1425:col-span-3')}
            key={plugin.name}
            plugin={plugin}
            matches={matches}
          />
        ))}
      </ColumnLayout>
    </section>
  );
}
