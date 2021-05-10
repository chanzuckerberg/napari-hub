import { useSearchState } from '@/context/search';

import { ColumnLayout } from '../common';
import { MediaFragment } from '../common/media';
import { SearchResult } from './SearchResult';

/**
 * Component for rendering the plugin search bar and results.
 */
export function PluginSearch() {
  const { results = [] } = useSearchState() ?? {};

  return (
    <ColumnLayout>
      {/* TODO filter column */}
      <MediaFragment greaterThanOrEqual="3xl">
        <div />
      </MediaFragment>

      {/* Search results */}
      <div>
        <h2 className="font-bold text-2xl mb-6">Browse plugins</h2>
        {results.map(({ plugin }) => (
          <SearchResult key={plugin.name} plugin={plugin} />
        ))}
      </div>
    </ColumnLayout>
  );
}
