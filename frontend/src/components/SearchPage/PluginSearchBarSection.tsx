import { useTranslation } from 'next-i18next';

import { ColumnLayout } from '@/components/ColumnLayout';
import { PluginSearchBar } from '@/components/SearchBar/PluginSearchBar';
import { SearchSection } from '@/components/SearchSection';
import { SEARCH_BAR_ID } from '@/constants/search';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

/**
 * Component that renders the landing page search bar.
 */
export function PluginSearchBarSection() {
  const [t] = useTranslation(['homePage', 'pluginsPage', 'common']);
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');

  if (isHomePageRedesign) {
    return (
      <SearchSection
        title={t('pluginsPage:plugins')}
        searchBar={
          <PluginSearchBar
            aria-describedby="plugin-search-title"
            large
            inputProps={{ placeholder: t('common:searchBarPlaceholder') }}
          />
        }
      />
    );
  }

  return (
    <ColumnLayout
      id={SEARCH_BAR_ID}
      className="bg-hub-primary-200 h-36 items-center px-sds-xl screen-495:px-12"
      classes={{
        // Use 3-column layout instead of 4-column.
        fourColumn: 'screen-1150:grid-cols-napari-3',
      }}
    >
      <div className="col-span-2 screen-875:col-span-3 screen-1425:col-start-2">
        <h2
          id="plugin-search-title"
          className="font-bold text-xl mb-sds-l whitespace-nowrap"
        >
          {t('common:searchBarPlaceholder')}
        </h2>

        <PluginSearchBar aria-describedby="plugin-search-title" large />
      </div>
    </ColumnLayout>
  );
}
