import { SearchSortType } from '@/store/search/constants';
import { I18nKeys } from '@/types/i18n';

/**
 * ID used for the plugin search bar on the home page.
 */
export const SEARCH_BAR_ID = 'search-bar';

/**
 * Beginning page used for initializing the state and setting the minimum page a
 * user can change to.
 */
export const BEGINNING_PAGE = 1;

/**
 * Max search results to show at a time.
 */
export const RESULTS_PER_PAGE = 15;

/**
 * Used for removing from plugin name / display name while sorting.
 */
export const NAPARI_PREFIX_REGEX = /^napari[ -]/;

/**
 * Sort options ordered in array based on how it should appear in the UI.
 */
export const SORT_OPTIONS = [
  SearchSortType.PluginName,
  SearchSortType.ReleaseDate,
  SearchSortType.FirstReleased,
  SearchSortType.TotalInstalls,
];

/**
 * Labels used for rendering sort options.
 */
export const SORT_LABELS: Record<SearchSortType, I18nKeys<'pluginsPage'>> = {
  [SearchSortType.Relevance]: 'pluginsPage:sort.relevance',
  [SearchSortType.FirstReleased]: 'pluginsPage:sort.newest',
  [SearchSortType.ReleaseDate]: 'pluginsPage:sort.recentlyUpdated',
  [SearchSortType.PluginName]: 'pluginsPage:sort.pluginName',
  [SearchSortType.TotalInstalls]: 'pluginsPage:sort.installs',
};
