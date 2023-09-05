import { useTranslation } from 'next-i18next';

import { PluginSearchBar } from '@/components/SearchBar/PluginSearchBar';
import { SearchSection } from '@/components/SearchSection';

/**
 * Component that renders the landing page search bar.
 */
export function PluginSearchBarSection() {
  const [t] = useTranslation(['homePage', 'pluginsPage', 'common']);

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
