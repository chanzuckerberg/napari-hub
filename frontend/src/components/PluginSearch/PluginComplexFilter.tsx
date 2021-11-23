import { ComplexFilter, DefaultMenuSelectOption } from 'czifui';
import { useEffect, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

import { useFilterData } from '@/context/filter';
import { FilterKey, searchFormStore } from '@/store/search/form.store';
import { HubDimension } from '@/types';

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

  return (
    <ComplexFilter
      data-testid="pluginFilter"
      label={FILTER_LABELS[filterKey] ?? filterKey}
      multiple
      search={SEARCH_ENABLED_FILTERS.has(filterKey)}
      onChange={(nextOptions) =>
        setPendingState(nextOptions as PluginMenuSelectOption[])
      }
      options={optionsRef.current}
      value={pendingState}
    />
  );
}
