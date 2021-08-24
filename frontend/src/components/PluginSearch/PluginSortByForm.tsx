import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';

import { Accordion } from '@/components/common';
import { Media, MediaFragment } from '@/components/common/media';
import { SearchSortType } from '@/store/search/constants';
import { searchQueryState } from '@/store/search/search.state';
import { sortTypeState } from '@/store/search/sort.state';

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
  const [sortType, setSortType] = useAtom(sortTypeState);
  const [searchQuery] = useAtom(searchQueryState);
  const isSearching = !!searchQuery;

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
        <FormLabel
          className="uppercase text-black font-semibold text-sm mb-2"
          component="legend"
          focused={false}
        >
          Sort By
        </FormLabel>
      </MediaFragment>

      <RadioGroup
        aria-label="sort plugins by"
        name="sort-by"
        value={sortType}
        onChange={(event) => setSortType(event.target.value as SearchSortType)}
      >
        {radios.map((currentSortType) => (
          <motion.div
            key={currentSortType}
            layout
            // Only animate opacity on relevance
            {...(currentSortType === SearchSortType.Relevance
              ? {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                }
              : {})}
          >
            <FormControlLabel
              data-testid="sortByRadio"
              data-selected={currentSortType === sortType}
              data-sort-type={currentSortType}
              value={currentSortType}
              control={
                <Radio
                  className={clsx('text-black fill-current')}
                  color="default"
                />
              }
              label={SORT_BY_LABELS[currentSortType]}
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
        <Accordion title="Sort By">{form}</Accordion>
      </Media>

      <Media greaterThanOrEqual="screen-875">{form}</Media>
    </>
  );
}
