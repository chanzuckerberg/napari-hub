import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';
import type { TFuncKey } from 'react-i18next';
import { useSnapshot } from 'valtio';

import { Accordion } from '@/components/Accordion';
import { SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';

const DEFAULT_SORT_BY_RADIO_ORDER: SearchSortType[] = [
  SearchSortType.TotalInstalls,
  SearchSortType.ReleaseDate,
  SearchSortType.FirstReleased,
  SearchSortType.PluginName,
];

const SORT_BY_LABELS: Record<SearchSortType, TFuncKey<'homePage'>> = {
  [SearchSortType.Relevance]: 'sort.relevance',
  [SearchSortType.FirstReleased]: 'sort.newest',
  [SearchSortType.ReleaseDate]: 'sort.recentlyUpdated',
  [SearchSortType.PluginName]: 'sort.pluginName',
  [SearchSortType.TotalInstalls]: 'sort.totalInstalls',
};

/**
 * Component for the radio form for selecting the plugin sort type.
 */
function SortForm() {
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);
  const isSearching = state.search.query;
  const [t] = useTranslation(['homePage']);

  const radios: SearchSortType[] = [];

  // Add relevance sort type if user is searching fro a plugin.
  if (isSearching) {
    radios.push(SearchSortType.Relevance);
  }

  radios.push(...DEFAULT_SORT_BY_RADIO_ORDER);

  return (
    <FormControl component="fieldset">
      {/* Only show label on larger screens. This is because the Accordion already includes a title. */}
      <legend className="uppercase text-black font-semibold text-sm mb-sds-s hidden screen-875:block">
        {t('homePage:sort.title')}
      </legend>

      <RadioGroup
        aria-label={t('homePage:ariaLabels.sortPlugins')}
        name="sort-by"
        value={state.sort}
        onChange={(event) => {
          searchStore.sort = event.target.value as SearchSortType;
        }}
      >
        {radios.map((sortType) => (
          <motion.div
            key={sortType}
            layout
            // Only animate opacity on relevance
            {...(sortType === SearchSortType.Relevance
              ? {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                }
              : {})}
          >
            <FormControlLabel
              data-testid="sortByRadio"
              data-selected={sortType === state.sort}
              data-sort-type={sortType}
              value={sortType}
              classes={{
                label: 'text-base',
              }}
              control={
                <Radio
                  className={clsx('text-black fill-current')}
                  color="default"
                />
              }
              label={t(`homePage:${SORT_BY_LABELS[sortType]}`) as ReactNode}
            />
          </motion.div>
        ))}
      </RadioGroup>
    </FormControl>
  );
}

/**
 * Renders the plugin sort form. For smaller screen sizes (< 875px), an
 * expandable accordion layout is used. For larger screens, the sort form is
 * rendered as-is.
 */
export function PluginSortByForm() {
  const [t] = useTranslation(['homePage']);
  const form = <SortForm />;

  return (
    <>
      <div className="screen-875:hidden">
        <Accordion className="uppercase" title={t('homePage:sort.title')}>
          {form}
        </Accordion>
      </div>

      <div className="hidden screen-875:block">{form}</div>
    </>
  );
}
