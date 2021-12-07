import clsx from 'clsx';
import { Button } from 'czifui';
import { set } from 'lodash';

import { Accordion } from '@/components/common/Accordion';
import { Media } from '@/components/common/media';
import { useSearchStore } from '@/store/search/context';
import { FilterKey } from '@/store/search/search.store';
import { isFeatureFlagEnabled } from '@/utils/featureFlags';

import { PluginComplexFilter } from './PluginComplexFilter';

export type FilterType = 'category' | 'requirement';

interface Props {
  filters: FilterKey[];
  filterType: FilterType;
}

const FILTER_LABEL_MAP: Record<FilterType, string> = {
  category: 'Filter by category',
  requirement: 'Filter by requirement',
};

/**
 * Button for clearing all filters defined in the `filters` prop.
 */
function ClearAllButton({ filters, filterType }: Props) {
  const { searchStore } = useSearchStore();

  return (
    <Button
      className="underline w-min"
      data-testid="clearAllButton"
      data-filter-type={filterType}
      onClick={() => {
        for (const filterKey of filters) {
          for (const stateKey of Object.keys(searchStore.filters[filterKey])) {
            set(searchStore.filters, [filterKey, stateKey], false);
          }
        }
      }}
      sdsType="primary"
      variant="text"
    >
      Clear all
    </Button>
  );
}

function getLabel(filterType: FilterType) {
  return isFeatureFlagEnabled('categoryFilters')
    ? FILTER_LABEL_MAP[filterType]
    : 'Filter';
}

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm(props: Props) {
  const { filters, filterType } = props;
  const label = getLabel(filterType);

  return (
    <div
      className={clsx(
        'grid grid-cols-1',
        'screen-600:grid-cols-2 screen-875:grid-cols-1',
        'space-y-4',
        'px-2 screen-875:px-0',
      )}
    >
      {/* Only show label on larger screens. This is because the Accordion already includes a title. */}
      <Media
        className="flex items-center justify-between"
        greaterThanOrEqual="screen-875"
      >
        <legend className="uppercase text-black font-semibold text-sm">
          {label}
        </legend>

        <ClearAllButton {...props} />
      </Media>

      <div className="flex flex-col col-span-2 space-y-2">
        {filters.map((filterKey) => (
          <PluginComplexFilter key={filterKey} filterKey={filterKey} />
        ))}
      </div>
    </div>
  );
}

/**
 * Renders a form for plugin filter. For smaller screen sizes (< 875px), an
 * expandable accordion layout is used. For larger screens, the filter form is
 * rendered as-is.
 */
export function PluginFilterByForm(props: Props) {
  const form = <FilterForm {...props} />;
  const { filterType } = props;
  const label = getLabel(filterType);

  return (
    <>
      <Media lessThan="screen-875">
        <Accordion title={label}>
          <ClearAllButton {...props} />

          {form}
        </Accordion>
      </Media>

      <Media greaterThanOrEqual="screen-875">{form}</Media>
    </>
  );
}
