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
        className="font-semibold text-black text-md mb-4"
      >
        {title}
      </FormLabel>
      <FormGroup>
        {filters.map((filter) => (
          <FormControlLabel
            control={
              <Checkbox
                value={filter.enabled}
                checked={filter.enabled}
                onChange={(event) => filter.setEnabled(event.target.checked)}
                className="text-black fill-current"
                color="default"
                icon={<CheckboxIcon />}
                checkedIcon={<CheckboxIcon checked />}
              />
            }
            label={filter.label}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}
