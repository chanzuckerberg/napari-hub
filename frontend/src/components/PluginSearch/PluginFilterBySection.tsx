import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from '@material-ui/core';

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

/**
 * Component for the section of each filter type
 */
export function PluginFilterBySection({ className, title, filters }: Props) {
  return (
    <FormControl className={className} component="fieldset">
      <FormLabel
        component="legend"
        className="font-semibold text-black text-sm mb-2"
        data-testid="title"
        focused={false}
      >
        {title}
      </FormLabel>
      <FormGroup>
        {filters.map((filter) => (
          <FormControlLabel
            className="items-start m-0"
            control={
              <Checkbox
                value={filter.enabled}
                checked={filter.enabled}
                onChange={(event) => filter.setEnabled(event.target.checked)}
                className="text-black fill-current py-1 pr-2 pl-0 mb-2 last:mb-0"
                color="default"
                icon={<CheckboxIcon className="w-4 h-4" />}
                checkedIcon={<CheckboxIcon checked className="w-4 h-4" />}
                // Disable ripple to prevent weird issue on Chrome where
                // clicking on the checkbox causes the next
                // PluginFilterBySection component below to render an invisible
                // title.
                disableRipple
              />
            }
            label={filter.label}
            key={filter.label}
            data-testid="input"
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}
