import { Checkbox } from '@material-ui/core';
import clsx from 'clsx';
import { useAtom, WritableAtom } from 'jotai';

import { CheckboxIcon } from '@/components/common/icons';

export interface FilterItem {
  label: string;
  state: WritableAtom<boolean, boolean>;
}

function getCheckboxId(label: string) {
  return `checkbox-${label}`;
}

function PluginFilterCheckbox({ label, state }: FilterItem) {
  const [enabled, setEnabled] = useAtom(state);
  const checkboxId = getCheckboxId(label);

  return (
    <Checkbox
      id={checkboxId}
      value={enabled}
      checked={enabled}
      onChange={(event) => setEnabled(event.target.checked)}
      className="text-black fill-current -mt-1 -ml-2"
      color="default"
      icon={<CheckboxIcon className="w-4 h-4" />}
      checkedIcon={<CheckboxIcon checked className="w-4 h-4" />}
    />
  );
}

function PluginFilterControl(item: FilterItem) {
  const { label } = item;
  const checkboxId = getCheckboxId(label);

  return (
    <div className="flex items-start" key={label} data-testid="filterCheckbox">
      <PluginFilterCheckbox {...item} />
      <label htmlFor={checkboxId}>{label}</label>
    </div>
  );
}

interface Props {
  className?: string;
  title: string;
  filters: FilterItem[];
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
        <PluginFilterControl key={filter.label} {...filter} />
      ))}
    </fieldset>
  );
}
