import { SearchSortType } from '@/store/search/constants';
import { FilterKey, FilterType } from '@/store/search/search.store';

import { AccordionTitle } from './utils';

export const getByHasText = (type: string, text: string): string =>
  `${type}:has-text("${text}")`;
export const getMetadata = (attribute: string): string =>
  `[data-testid="searchResultMetadata"] >> ${attribute}`;

enum CommonSelectors {
  appBarHome = '[data-testid=appBarHome]:visible',
}

enum SearchSelectors {
  clearQueryButton = '[data-testid=clearQueryButton]:visible',
  searchInput = '[data-testid=searchBarInput]',
  result = '[data-testid=searchResultName]:visible',
  resultName = '[data-testid=searchResultName]:visible',
  resultSummary = '[data-testid=searchResultSummary]:visible',
  resultAuthor = '[data-testid=searchResultAuthor]:visible',
}

enum SortSelectors {
  selected = '[data-testid=sortByRadio][data-selected=true]:visible',
  selectedVisible = '[data-testid=sortByRadio][data-selected=true]',
}

enum PluginSelectors {
  details = '[data-testid=pluginDetails]:visible',
  title = '[data-testid=pluginDetails]:visible h1',
}

enum FilterSelectors {
  options = '[role=tooltip] [role=option]:visible',
  chipLabel = '.MuiChip-label:visible',
}

export const selectors = {
  plugin: PluginSelectors,
  search: SearchSelectors,

  common: {
    ...CommonSelectors,

    getAccordion(title: AccordionTitle) {
      return `[data-testid=accordionSummary][data-title="${title}"]`;
    },
  },

  filters: {
    ...FilterSelectors,

    getFilterButton(filterKey: FilterKey) {
      return `[data-testid=pluginFilter][data-filter=${filterKey}]:visible`;
    },

    getChips(filterKey: FilterKey) {
      return `[data-filter=${filterKey}] .MuiChip-root:visible`;
    },

    getClearAllButton(filterType: FilterType) {
      return `[data-testid=clearAllButton][data-filter-type=${filterType}]:visible`;
    },
  },

  sort: {
    ...SortSelectors,

    getRadio(sort: SearchSortType) {
      return `[data-testid=sortByRadio][data-sort-type=${sort}]:visible`;
    },

    getRadioInput(sort: SearchSortType) {
      return `input[value=${sort}]:visible`;
    },
  },
};
