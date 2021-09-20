import { Checkbox } from '@material-ui/core';
import clsx from 'clsx';

import { CheckboxIcon } from '@/components/common/icons';

export interface FilterItem {
  label: string;
  filterKey: string;
  stateKey: string;
  useFilterState(): boolean;
  setFilterState(enabled: boolean): void;
}

interface Props {
  className?: string;
  title: string;
  filters: FilterItem[];
}

function getCheckboxId(filterKey: string, stateKey: string) {
  return `checkbox-${filterKey}-${stateKey}`;
}

interface FilterCheckboxProps extends FilterItem {
  checkboxId: string;
}

function FilterCheckbox({
  checkboxId,
  useFilterState,
  setFilterState,
}: FilterCheckboxProps) {
  const enabled = useFilterState();

  return (
    <Checkbox
      id={checkboxId}
      value={enabled}
      checked={enabled}
      onChange={(event) => setFilterState(event.target.checked)}
      className="text-black fill-current -mt-1 -ml-2"
      color="default"
      icon={<CheckboxIcon className="w-4 h-4" />}
      checkedIcon={<CheckboxIcon checked className="w-4 h-4" />}
    />
  );
}

/**
 * Component for the section of each filter type
 */
export function PluginFilterBySection({ className, title, filters }: Props) {
  return (
    <fieldset className={clsx(className, 'flex flex-col')}>
      <legend
        className="font-semibold text-black text-sm mb-2"
        data-testid="filterCheckboxTitle"
      >
        {title}
      </legend>

      {filters.map((filter) => {
        const checkboxId = getCheckboxId(filter.filterKey, filter.stateKey);

        return (
          <div
            className="flex items-start"
            key={filter.label}
            data-testid="filterCheckbox"
          >
            <FilterCheckbox checkboxId={checkboxId} {...filter} />
            <label htmlFor={checkboxId}>{filter.label}</label>
          </div>
        );
      })}
    </fieldset>
  );
}
