// TODO Refactor to use SDS after `czifui` package is upgraded to latest
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useSnapshot } from 'valtio';

import { ChevronUp } from '@/components/icons';
import { Text } from '@/components/Text';
import { SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';
import { I18nKeys } from '@/types/i18n';

import styles from './SortDropdown.module.scss';

const SORT_OPTIONS = [
  SearchSortType.PluginName,
  SearchSortType.ReleaseDate,
  SearchSortType.FirstReleased,
  SearchSortType.TotalInstalls,
];

const SORT_BY_LABELS: Record<SearchSortType, I18nKeys<'pluginsPage'>> = {
  [SearchSortType.Relevance]: 'pluginsPage:sort.relevance',
  [SearchSortType.FirstReleased]: 'pluginsPage:sort.newest',
  [SearchSortType.ReleaseDate]: 'pluginsPage:sort.recentlyUpdated',
  [SearchSortType.PluginName]: 'pluginsPage:sort.pluginName',
  [SearchSortType.TotalInstalls]: 'pluginsPage:sort.installs',
};

function SortChevronUp() {
  return <ChevronUp className={styles.chevron} />;
}

export function SortDropdown() {
  const { t } = useTranslation(['pluginsPage']);
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);
  const isSearching = !!state.search.query;

  const options: SearchSortType[] = [];

  if (isSearching) {
    options.push(SearchSortType.Relevance);
  }

  options.push(...SORT_OPTIONS);

  return (
    <div className="flex space-x-[12px] items-center">
      <Text element="span" className="whitespace-nowrap uppercase" variant="h5">
        {t('pluginsPage:sortBy')}:
      </Text>

      <Select
        className={clsx(styles.select, 'w-[185px] hover:bg-hub-gray-100')}
        classes={{
          select: 'p-sds-s',
        }}
        value={state.sort}
        onChange={(event) => {
          searchStore.sort = event.target.value as SearchSortType;
        }}
        IconComponent={SortChevronUp}
        renderValue={(option) => (
          <Text element="span" variant="h5">
            {t(SORT_BY_LABELS[option])}
          </Text>
        )}
      >
        {options.map((option) => (
          <MenuItem
            className="bg-white hover:bg-hub-gray-100 p-sds-s m-sds-s"
            key={option}
            value={option}
          >
            <Text
              weight={state.sort === option ? 'bold' : 'regular'}
              variant="bodyS"
            >
              {t(SORT_BY_LABELS[option])}
            </Text>
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}
