import { useTranslation } from 'next-i18next';

import { ColumnLayout } from '@/components/ColumnLayout';
import { SearchBar } from '@/components/SearchBar';
import { SEARCH_BAR_ID } from '@/constants/search';

/**
 * Component that renders the landing page search bar.
 */
export function PluginSearchBar() {
  const [t] = useTranslation(['homePage']);

  return (
    <ColumnLayout
      id={SEARCH_BAR_ID}
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
          {t('homePage:searchBar')}
        </h2>

        <SearchBar aria-describedby="plugin-search-title" large />
      </div>
    </ColumnLayout>
  );
}
