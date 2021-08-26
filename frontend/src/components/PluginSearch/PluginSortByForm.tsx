import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import { Accordion, SkeletonLoader } from '@/components/common';
import { Media, MediaFragment } from '@/components/common/media';
import { SearchSortType } from '@/store/search/constants';
import { searchFormStore } from '@/store/search/form.store';

const DEFAULT_SORT_BY_RADIO_ORDER: SearchSortType[] = [
  SearchSortType.PluginName,
  SearchSortType.ReleaseDate,
  SearchSortType.FirstReleased,
];

const SORT_BY_LABELS: Record<SearchSortType, string> = {
  [SearchSortType.Relevance]: 'Relevance',
  [SearchSortType.FirstReleased]: 'Newest',
  [SearchSortType.ReleaseDate]: 'Recently updated',
  [SearchSortType.PluginName]: 'Plugin name',
};

/**
 * Component for the radio form for selecting the plugin sort type.
 */
function SortForm() {
  const state = useSnapshot(searchFormStore);
  const isSearching = state.search.query;

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
          Sort By
        </legend>
      </MediaFragment>

      <RadioGroup
        aria-label="sort plugins by"
        name="sort-by"
        value={state.sort}
        onChange={(event) => {
          searchFormStore.sort = event.target.value as SearchSortType;
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
              value={sortType}
              control={
                <Radio
                  className={clsx('text-black fill-current')}
                  color="default"
                />
              }
              label={SORT_BY_LABELS[sortType]}
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
  const form = <SortForm />;

  return (
    <>
      <Media lessThan="screen-875">
        <SkeletonLoader
          className="h-12"
          render={() => <Accordion title="Sort By">{form}</Accordion>}
        />
      </Media>

      <Media greaterThanOrEqual="screen-875">
        <SkeletonLoader className="h-40" render={() => form} />
      </Media>
    </>
  );
}
