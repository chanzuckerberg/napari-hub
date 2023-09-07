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
import { SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';

/**
 * Component for the radio form for selecting the plugin sort type.
 */
function SortForm() {
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);
  const isSearching = state.search.query;
  const [t] = useTranslation(['homePage', 'pluginsPage']);

  const radios: SearchSortType[] = [];

  // Add relevance sort type if user is searching fro a plugin.
  if (isSearching) {
    radios.push(SearchSortType.Relevance);
  }

  radios.push(...SORT_OPTIONS);

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
              label={t(SORT_LABELS[sortType]) as string}
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
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);

  return (
    <>
      <div className="screen-875:hidden">
        <Accordion
          title={`${t('pluginsPage:sortByMobile', {
            sortType: t(SORT_LABELS[state.sort]),
          })}`}
        >
          {form}
        </Accordion>
      </div>

      <div className="hidden screen-875:block">{form}</div>
    </>
  );
}
