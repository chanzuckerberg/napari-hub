import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { useSnapshot } from 'valtio';

import { Accordion } from '@/components/Accordion';
import { SORT_LABELS, SORT_OPTIONS } from '@/constants/search';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';
import { I18nKeys } from '@/types/i18n';

const DEFAULT_SORT_BY_RADIO_ORDER: SearchSortType[] = [
  SearchSortType.TotalInstalls,
  SearchSortType.ReleaseDate,
  SearchSortType.FirstReleased,
  SearchSortType.PluginName,
];

const SORT_BY_LABELS: Record<SearchSortType, I18nKeys<'homePage'>> = {
  [SearchSortType.Relevance]: 'homePage:sort.relevance',
  [SearchSortType.FirstReleased]: 'homePage:sort.newest',
  [SearchSortType.ReleaseDate]: 'homePage:sort.recentlyUpdated',
  [SearchSortType.PluginName]: 'homePage:sort.pluginName',
  [SearchSortType.TotalInstalls]: 'homePage:sort.totalInstalls',
};

/**
 * Component for the radio form for selecting the plugin sort type.
 */
function SortForm() {
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);
  const isSearching = state.search.query;
  const [t] = useTranslation(['homePage', 'pluginsPage']);
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');

  const radios: SearchSortType[] = [];
  const options = isHomePageRedesign
    ? SORT_OPTIONS
    : DEFAULT_SORT_BY_RADIO_ORDER;
  const labels = isHomePageRedesign ? SORT_LABELS : SORT_BY_LABELS;

  // Add relevance sort type if user is searching fro a plugin.
  if (isSearching) {
    radios.push(SearchSortType.Relevance);
  }

  radios.push(...options);

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
              label={t(labels[sortType])}
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
  const [t] = useTranslation(['homePage', 'pluginsPage']);
  const form = <SortForm />;
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);

  return (
    <>
      <div className="screen-875:hidden">
        <Accordion
          className={clsx(!isHomePageRedesign && 'uppercase')}
          title={
            isHomePageRedesign
              ? `${t('pluginsPage:sortByMobile', {
                  sortType: t(SORT_LABELS[state.sort]),
                })}`
              : t('homePage:sort.title')
          }
        >
          {form}
        </Accordion>
      </div>

      <div className="hidden screen-875:block">{form}</div>
    </>
  );
}
