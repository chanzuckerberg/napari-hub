import { useEffect, useRef } from 'react';

import { SearchBar } from '@/components';
import { ColumnLayout } from '@/components/common';
import { useSearchState } from '@/context/search';

/**
 * Component that renders the landing page search bar.
 */
export function PluginSearchBar() {
  const { search } = useSearchState() ?? {};
  const searchBarRef = useRef<HTMLDivElement | null>(null);

  // Scroll to search container when the search changes.
  useEffect(() => {
    if (search?.query) {
      const alignTop = true;
      searchBarRef.current?.scrollIntoView?.(alignTop);
    }
  }, [search]);

  return (
    <ColumnLayout
      innerRef={searchBarRef}
      className="bg-napari-light h-36 items-center px-6 md:px-12"
      classes={{
        // Use 3-column layout instead of 4-column.
        fourColumn: 'screen-1150:grid-cols-napari-3',
      }}
    >
      <div className="col-span-2 screen-875:col-span-3 screen-1425:col-start-2">
        <h2
          id="plugin-search-title"
          className="font-bold text-xl mb-4 whitespace-nowrap"
        >
          Search for a plugin by keyword or author
        </h2>

        <SearchBar aria-describedby="plugin-search-title" large />
      </div>
    </ColumnLayout>
  );
}
