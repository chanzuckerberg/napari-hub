import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from '@material-ui/core';

import { CheckboxIcon } from '@/components/common/icons';

interface FilterItem {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

interface Props {
  title: string;
  filters: FilterItem[];
}

/**
 * Component for the section of each filter type
 */
export function PluginFilterBySection({ title, filters }: Props) {
  return (
    <FormControl component="fieldset">
      <FormLabel
        component="legend"
        className="font-semibold text-black text-sm mb-2"
      >
        {title}
      </FormLabel>
      <FormGroup className="gap-2 justify-items-start">
        {filters.map((filter) => (
          <FormControlLabel
            className="items-start m-0"
            control={
              <Checkbox
                value={filter.enabled}
                checked={filter.enabled}
                onChange={(event) => filter.setEnabled(event.target.checked)}
                className="text-black fill-current py-1 pr-2 pl-0"
                color="default"
                icon={<CheckboxIcon className="w-4 h-4" />}
                checkedIcon={<CheckboxIcon checked className="w-4 h-4" />}
              />
            }
            label={filter.label}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}
