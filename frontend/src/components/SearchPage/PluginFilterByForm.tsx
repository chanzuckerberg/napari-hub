import clsx from 'clsx';
import { Button } from 'czifui';
import { set } from 'lodash';
import { useTranslation } from 'next-i18next';
import type { TFuncKey } from 'react-i18next';

import { Accordion } from '@/components/Accordion';
import { Media } from '@/components/media';
import { useSearchStore } from '@/store/search/context';
import { FilterKey } from '@/store/search/search.store';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';

import { PluginComplexFilter } from './PluginComplexFilter';

export type FilterType = 'category' | 'requirement';

interface Props {
  filters: FilterKey[];
  filterType: FilterType;
}

/**
 * Button for clearing all filters defined in the `filters` prop.
 */
function ClearAllButton({ filters, filterType }: Props) {
  const { searchStore } = useSearchStore();
  const [t] = useTranslation(['homePage']);

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
      {t('homePage:filter.clearAll')}
    </Button>
  );
}

const FILTER_LABEL_MAP: Record<FilterType, TFuncKey<'homePage'>> = {
  category: 'filter.title.category',
  requirement: 'filter.title.requirement',
};

function useFilterLabel(filterType: FilterType) {
  const [t] = useTranslation(['homePage']);
  const isEnabled = useIsFeatureFlagEnabled('categoryFilters');

  if (isEnabled) {
    return t(`homePage:${FILTER_LABEL_MAP[filterType]}`) as string;
  }

  return t('homePage:filter.title.base');
}

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm(props: Props) {
  const { filters, filterType } = props;
  const label = useFilterLabel(filterType);

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
  const label = useFilterLabel(filterType);

  return (
    <>
      <Media lessThan="screen-875">
        <Accordion className="uppercase" title={label}>
          <ClearAllButton {...props} />

          {form}
        </Accordion>
      </Media>

      <Media greaterThanOrEqual="screen-875">{form}</Media>
    </>
  );
}
