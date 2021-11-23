import styled from '@emotion/styled';
import Popper from '@material-ui/core/Popper';
import TextField from '@material-ui/core/TextField';
import {
  AutocompleteRenderInputParams,
  AutocompleteRenderOptionState,
} from '@material-ui/lab/Autocomplete';
import clsx from 'clsx';
import { ComplexFilter, DefaultMenuSelectOption } from 'czifui';
import { useEffect, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

import { useFilterData } from '@/context/filter';
import { FilterKey, searchFormStore } from '@/store/search/form.store';
import { appTheme } from '@/theme';
import { HubDimension } from '@/types';

import { CheckboxIcon, Search } from '../common/icons';
import styles from './PluginComplexFilter.module.scss';

/**
 * Labels to use for a particular filter state.
 */
const FILTER_LABELS: Partial<Record<FilterKey, string>> = {
  license: 'License',
  operatingSystems: 'Operating system',
  pythonVersions: 'Python versions',
  supportedData: 'Supported data',
  workflowStep: 'Workflow step',
  imageModality: 'Image modality',
};

/**
 * Labels to use for a particular filter option.
 */
const FILTER_OPTION_LABELS: Record<string, string | undefined> = {
  // Operating System
  linux: 'Linux',
  mac: 'macOS',
  windows: 'Windows',

  // Development Status
  stable: 'Only show stable plugins',

  // License
  openSource: 'Limit to plugins with open source license',
};

const SEARCH_ENABLED_FILTERS = new Set<FilterKey>(['workflowStep']);

interface Props {
  filterKey: FilterKey;
}

/**
 * Option data structure used in the complex filter autocomplete component.
 */
interface PluginMenuSelectOption extends DefaultMenuSelectOption {
  /**
   * Key used for identifying what state to use when the option is enabled / disabled.
   */
  stateKey: string;
}

const StyledPopper = styled(Popper)`
  background: #fff;
  box-shadow: ${appTheme.shadows?.[10]};
  display: flex;
  flex-direction: column;
  max-width: 225px;
  padding: 0.75rem 0;
  width: 100%;

  .MuiAutocomplete-popper {
    background: #fff;
    position: relative;
    width: 100% !important;
  }
`;

/**
 * Map of hub dimensions to their corresponding UI state.
 */
const FILTER_KEY_HUB_DIMENSION_MAP: Partial<Record<FilterKey, HubDimension>> = {
  imageModality: 'Image modality',
  supportedData: 'Supported data',
  workflowStep: 'Workflow step',
};

/**
 * Helper that creates a new autocomplete option for the given state key.
 *
 * @param stateKey The state key identifier.
 * @returns A new autocomplete option.
 */
function getFilterOption(stateKey: string): PluginMenuSelectOption {
  return {
    stateKey,
    name: FILTER_OPTION_LABELS[stateKey] ?? stateKey,
  };
}

/**
 * Complex filter component for filtering a specific part of the filter state.
 */
export function PluginComplexFilter({ filterKey }: Props) {
  const { categoryFilterKeys } = useFilterData();

  const state = useSnapshot(searchFormStore);
  const filterState = state.filters[filterKey];

  const [pendingState, setPendingState] = useState<PluginMenuSelectOption[]>(
    // Use truthy values in filter state as the initial value.
    Object.entries(filterState)
      .filter(([, value]) => value)
      .map(([stateKey]) => getFilterOption(stateKey)),
  );

  // Store options in ref to prevent re-render on options value. There's a race
  // condition issue when re-rendering ComplexFilter when `options` and
  // `pendingValue` are updated at the same time.
  const optionsRef = useRef(
    (() => {
      const hubDimension = FILTER_KEY_HUB_DIMENSION_MAP[filterKey];
      const stateKeys = Object.keys(filterState);

      // Add additional
      if (hubDimension) {
        const additionalKeys = Array.from(
          categoryFilterKeys[hubDimension] ?? [],
        );
        stateKeys.push(...additionalKeys);
      }

      return stateKeys.map(getFilterOption);
    })(),
  );

  // Effect that merges the pending state into the global state.
  useEffect(() => {
    const enabledStates = new Set(
      pendingState.map((option) => option.stateKey),
    );
    const nextState: Record<string, boolean> = {};

    for (const key of Object.keys(filterState)) {
      nextState[key] = enabledStates.has(key);
    }

    Object.assign(searchFormStore.filters[filterKey], nextState);
  }, [filterKey, filterState, pendingState]);

  const isSearchEnabled = SEARCH_ENABLED_FILTERS.has(filterKey);

  return (
    <ComplexFilter
      className={styles.complexFilter}
      data-testid="pluginFilter"
      data-complex-filter
      data-filter={filterKey}
      label={FILTER_LABELS[filterKey] ?? filterKey}
      multiple
      search={isSearchEnabled}
      onChange={(nextOptions) =>
        setPendingState(nextOptions as PluginMenuSelectOption[])
      }
      MenuSelectProps={{
        classes: {
          groupLabel: 'text-[0.875rem] leading-normal text-black font-semibold',
          option: 'text-[2rem]',
          root: clsx('px-4', styles.autoComplete, isSearchEnabled && 'mb-3'),
          paper: 'w-[14.0625rem]',
        },

        renderInput: (params: AutocompleteRenderInputParams) => (
          <TextField
            autoFocus
            fullWidth
            placeholder="search for a category"
            ref={params.InputProps.ref}
            inputProps={params.inputProps}
            // eslint-disable-next-line react/jsx-no-duplicate-props
            InputProps={{
              className: 'text-[0.6875rem]',
              endAdornment: <Search />,
            }}
          />
        ),

        renderOption: (
          option: PluginMenuSelectOption,
          { selected }: AutocompleteRenderOptionState,
        ) => {
          return (
            <div className="flex space-x-2 py-2 px-4">
              <CheckboxIcon checked={selected} />

              <p
                className={clsx(
                  '-mt-1 text-[0.875rem] break-words leading-normal',
                  selected && 'text-black',
                )}
              >
                {option.name}
              </p>
            </div>
          );
        },
      }}
      options={optionsRef.current}
      value={pendingState}
      PopperComponent={StyledPopper}
    />
  );
}
