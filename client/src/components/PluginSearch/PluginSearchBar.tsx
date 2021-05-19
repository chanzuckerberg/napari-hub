import { useEffect } from 'react';

import { SearchBar } from '@/components';
import { ColumnLayout } from '@/components/common';
import { useActiveQueryParameter } from '@/context/search';

import { PLUGIN_SEARCH_ID } from './PluginSearch.constants';

/**
 * Component that renders the landing page search bar.
 */
export function PluginSearchBar() {
  const activeQuery = useActiveQueryParameter();

  // Scroll to search container when the search changes.
  useEffect(() => {
    if (activeQuery) {
      window.location.hash = PLUGIN_SEARCH_ID;
    }
  }, [activeQuery]);

  return (
    <ColumnLayout
      id={PLUGIN_SEARCH_ID}
      className="bg-napari-light h-36 items-center px-6 md:px-12"
      classes={{
        // Use 3-column layout instead of 4-column.
        fourColumn: 'screen-1150:grid-cols-napari-3',
      }}
    >
      <div className="col-span-2 screen-875:col-span-3 screen-1425:col-start-2">
        <h2 className="font-bold text-xl mb-4 whitespace-nowrap">
          Search for a plugin by keyword or author
        </h2>

        <SearchBar large />
      </div>
    </ColumnLayout>
  );
}
