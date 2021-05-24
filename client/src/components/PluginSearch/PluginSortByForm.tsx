import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';
import clsx from 'clsx';
import { motion } from 'framer-motion';

import { Accordion } from '@/components/common';
import { MediaFragment } from '@/components/common/media';
import { SearchSortType, useSearchState } from '@/context/search';

const DEFAULT_SORT_BY_RADIO_ORDER: SearchSortType[] = [
  SearchSortType.PluginName,
  SearchSortType.ReleaseDate,
  SearchSortType.FirstReleased,
];

const SORT_BY_LABELS: Record<SearchSortType, string> = {
  [SearchSortType.Relevance]: 'Relevance',
  [SearchSortType.FirstReleased]: 'First released',
  [SearchSortType.ReleaseDate]: 'Release date',
  [SearchSortType.PluginName]: 'Plugin name',
};

function SortForm() {
  const { search, sort } = useSearchState() ?? {};
  const isSearching = !!search?.query;

  const radios: SearchSortType[] = [];

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
        value={sort?.sortType}
        onChange={(event) => sort?.setSortType(event.target.value)}
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

export function PluginSortByForm() {
  const form = <SortForm />;

  return (
    <>
      <MediaFragment lessThan="screen-875">
        <Accordion title="Sort By">{form}</Accordion>
      </MediaFragment>

      <MediaFragment greaterThanOrEqual="screen-875">{form}</MediaFragment>
    </>
  );
}
