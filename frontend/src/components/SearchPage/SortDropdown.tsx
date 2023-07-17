// TODO Refactor to use SDS after `czifui` package is upgraded to latest
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useSnapshot } from 'valtio';

import { ChevronUp } from '@/components/icons';
import { Text } from '@/components/Text';
import { SORT_LABELS, SORT_OPTIONS } from '@/constants/search';
import { SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';

import styles from './SortDropdown.module.scss';

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
        data-testid="sortDropdown"
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
            {t(SORT_LABELS[option]) as string}
          </Text>
        )}
      >
        {options.map((option) => (
          <MenuItem
            data-testid="sortOption"
            data-sort-type={option}
            className="bg-white hover:bg-hub-gray-100 p-sds-s m-sds-s"
            key={option}
            value={option}
          >
            <Text
              weight={state.sort === option ? 'bold' : 'regular'}
              variant="bodyS"
            >
              {t(SORT_LABELS[option]) as string}
            </Text>
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}
