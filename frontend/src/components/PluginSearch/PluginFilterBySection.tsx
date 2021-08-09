import { Checkbox } from '@material-ui/core';
import clsx from 'clsx';

import { CheckboxIcon } from '@/components/common/icons';

export interface FilterItem {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

interface Props {
  className?: string;
  title: string;
  filters: FilterItem[];
}

function getCheckboxId(label: string) {
  return `checkbox-${label}`;
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

      {filters.map((filter) => (
        <div
          className="flex items-start"
          key={filter.label}
          data-testid="filterCheckbox"
        >
          <Checkbox
            id={getCheckboxId(filter.label)}
            value={filter.enabled}
            checked={filter.enabled}
            onChange={(event) => filter.setEnabled(event.target.checked)}
            className="text-black fill-current -mt-1 -ml-2"
            color="default"
            icon={<CheckboxIcon className="w-4 h-4" />}
            checkedIcon={<CheckboxIcon checked className="w-4 h-4" />}
          />

          <label htmlFor={getCheckboxId(filter.label)}>{filter.label}</label>
        </div>
      ))}
    </fieldset>
  );
}
