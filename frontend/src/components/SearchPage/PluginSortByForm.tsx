import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import type { TFuncKey } from 'react-i18next';
import { useSnapshot } from 'valtio';

import { Accordion } from '@/components/Accordion';
import { Media, MediaFragment } from '@/components/media';
import { SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';

const DEFAULT_SORT_BY_RADIO_ORDER: SearchSortType[] = [
  SearchSortType.PluginName,
  SearchSortType.ReleaseDate,
  SearchSortType.FirstReleased,
];

const SORT_BY_LABELS: Record<SearchSortType, TFuncKey<'homePage'>> = {
  [SearchSortType.Relevance]: 'sort.relevance',
  [SearchSortType.FirstReleased]: 'sort.newest',
  [SearchSortType.ReleaseDate]: 'sort.recentlyUpdated',
  [SearchSortType.PluginName]: 'sort.pluginName',
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
      <MediaFragment greaterThanOrEqual="screen-875">
        <legend className="uppercase text-black font-semibold text-sm mb-2">
          {t('homePage:sort.title')}
        </legend>
      </MediaFragment>

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
              control={
                <Radio
                  className={clsx('text-black fill-current')}
                  color="default"
                />
              }
              label={t(`homePage:${SORT_BY_LABELS[sortType]}`)}
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
      <Media lessThan="screen-875">
        <Accordion className="uppercase" title={t('homePage:sort.title')}>
          {form}
        </Accordion>
      </Media>

      <Media greaterThanOrEqual="screen-875">{form}</Media>
    </>
  );
}
