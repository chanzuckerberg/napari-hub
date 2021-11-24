import styled from '@emotion/styled';
import Popper from '@material-ui/core/Popper';
import TextField from '@material-ui/core/TextField';
import {
  AutocompleteRenderInputParams,
  AutocompleteRenderOptionState,
} from '@material-ui/lab/Autocomplete';
import clsx from 'clsx';
import {
  Button,
  ComplexFilter,
  DefaultMenuSelectOption,
  InputDropdownProps,
} from 'czifui';
import { get, isEqual } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe, useSnapshot } from 'valtio';

import { useSearchStore } from '@/store/search/context';
import { FilterKey } from '@/store/search/search.store';
import { appTheme } from '@/theme';

import { CheckboxIcon, ChevronDown, ChevronUp, Search } from '../common/icons';
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

const CATEGORY_FILTERS = new Set<FilterKey>(['workflowStep', 'imageModality']);

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
 * Map of for grouping workflow steps under a specific label.
 */
const WORKFLOW_STEP_GROUP_MAP: Partial<Record<string, string>> = {
  'Image registration': 'Image processing',
  'Image correction': 'Image processing',
  'Image enhancement': 'Image processing',
  'Image reconstruction': 'Image processing',
  'Pixel classification': 'Image segmentation & object detection',
  'Image feature detection': 'Image segmentation & object detection',
  'Image annotation': 'Image segmentation & object detection',
  'Filament tracing': 'Image segmentation & object detection',
  'Object classification': 'Object-based analysis',
  'Object-based colocalisation': 'Object-based analysis',
  'Object feature extraction': 'Object-based analysis',
  'Object tracking': 'Object-based analysis',
  Clustering: 'Object-based analysis',
  'Frequency domain analysis': 'Image-based analysis',
  'Pixel-based colocalisation': 'Image-based analysis',
  'Fluorescence correlation spectroscopy': 'Image-based analysis',
  'Optical flow analysis': 'Image-based analysis',
  'Image Segmentation': 'Image segmentation & object detection',
  Visualization: 'Visualization',
  'Synthetic image generation': 'Data generation',
  'Morphological operations': 'Image processing',
  'Image fusion': 'Image processing',
  'Image classification': 'Image-based analysis',
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

function InputDropdown(props: InputDropdownProps) {
  const { label, sdsStage } = props;
  const iconSizeClassName = 'w-4 h-4';

  return (
    <Button
      {...props}
      className="py-2 px-0 text-black w-full flex justify-between"
      classes={{
        label: 'border-b border-black pb-2',
      }}
    >
      <span className="font-semibold text-sm">{label}</span>
      {sdsStage === 'default' && <ChevronDown className={iconSizeClassName} />}
      {sdsStage === 'userInput' && <ChevronUp className={iconSizeClassName} />}
    </Button>
  );
}

/**
 * Complex filter component for filtering a specific part of the filter state.
 */
export function PluginComplexFilter({ filterKey }: Props) {
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);
  const filterStore = searchStore.filters[filterKey];
  const filterState = state.filters[filterKey];

  // Store options in ref to prevent re-render on options value. There's a race
  // condition issue when re-rendering ComplexFilter when `options` and
  // `pendingValue` are updated at the same time.
  const optionsRef = useRef(Object.keys(filterState).map(getFilterOption));

  const getEnabledOptions = useCallback(
    () =>
      optionsRef.current.filter((option) =>
        get(filterStore, option.stateKey, false),
      ),
    [filterStore],
  );

  const [pendingState, setPendingState] = useState<PluginMenuSelectOption[]>(
    // Use truthy values in filter state as the initial value. Options need to
    // be taken from `optionsRef` because the autocomplete component compares
    // values using referential equality.
    getEnabledOptions,
  );

  // Effect for keeping the local pending state in sync with external changes
  // to the filter store.
  useEffect(
    () =>
      subscribe(filterStore, () => {
        const options = getEnabledOptions();

        // Only update the state if it changed to prevent unnecessary re-renders.
        if (!isEqual(options, pendingState)) {
          setPendingState(options);
        }
      }),
    [filterStore, getEnabledOptions, pendingState],
  );

  // Effect that merges the pending state into the global state.
  useEffect(() => {
    const enabledStates = new Set(
      pendingState.map((option) => option.stateKey),
    );
    const nextState: Record<string, boolean> = {};

    for (const key of Object.keys(filterStore)) {
      nextState[key] = enabledStates.has(key);
    }

    Object.assign(filterStore, nextState);
  }, [filterStore, pendingState]);

  const isSearchEnabled = SEARCH_ENABLED_FILTERS.has(filterKey);

  // Effect that sets the max width of the tooltip container when it is added to
  // the DOM. This is required so that the width is only as wide as the filter
  // component. Otherwise, it would fill the whole screen.
  useEffect(() => {
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        // Only observe added nodes.
        mutation.addedNodes.forEach((node) => {
          const tooltip = node as HTMLDivElement;
          // Check if current added node is a tooltip
          if (tooltip.getAttribute('role') === 'tooltip') {
            // Flag for if the tooltip is for the current filter.
            const isActiveFilter = !!tooltip.querySelector(
              `[data-filter=${filterKey}]`,
            );

            // Get the filter node for the current filter.
            const complexFilterNode =
              isActiveFilter &&
              document.querySelector(
                `[data-complex-filter][data-filter=${filterKey}]`,
              );

            if (complexFilterNode) {
              const width = complexFilterNode.clientWidth;

              // Set the width of the tooltip to be the same width as the filter
              // component. If the screen width is smaller than 300px, then
              // default to 100% because the tooltip does not fill the screen
              // for sizes <300px.
              tooltip.style.maxWidth =
                window.outerWidth < 300 ? '100%' : `${width}px`;
            }
          }
        }),
      ),
    );

    observer.observe(document.body, { childList: true });

    return () => observer.disconnect();
  }, [filterKey]);

  return (
    <ComplexFilter
      className={clsx(
        styles.complexFilter,
        CATEGORY_FILTERS.has(filterKey) && styles.categories,
      )}
      data-testid="pluginFilter"
      // Data attribute used to query the complex filter node.
      data-complex-filter
      // Data attribute used to query the complex filter node by filter.
      data-filter={filterKey}
      label={FILTER_LABELS[filterKey] ?? filterKey}
      multiple
      search={isSearchEnabled}
      onChange={(nextOptions) =>
        setPendingState(nextOptions as PluginMenuSelectOption[])
      }
      InputDropdownComponent={InputDropdown}
      MenuSelectProps={{
        classes: {
          groupLabel:
            'text-[0.875rem] leading-normal text-black font-semibold top-0',
          root: clsx('px-4', styles.autoComplete, isSearchEnabled && 'mb-3'),
          noOptions: 'text-[0.875rem]',
        },

        noOptionsText: 'No categories',

        // Data attribute used for querying the tooltip for the current filter.
        'data-filter': filterKey,

        groupBy: (option: PluginMenuSelectOption) =>
          WORKFLOW_STEP_GROUP_MAP[option.stateKey] ?? '',

        renderInput: (params: AutocompleteRenderInputParams) => (
          <TextField
            autoFocus
            fullWidth
            placeholder="search for a category"
            ref={params.InputProps.ref}
            inputProps={params.inputProps}
            // eslint-disable-next-line react/jsx-no-duplicate-props
            InputProps={{
              className: 'text-[0.6875rem] border-b border-black',
              disableUnderline: true,
              endAdornment: <Search />,
            }}
          />
        ),

        renderOption: (
          option: PluginMenuSelectOption,
          { selected }: AutocompleteRenderOptionState,
        ) => (
          <div className="flex space-x-2 py-1 px-4">
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
        ),
      }}
      options={optionsRef.current}
      value={pendingState}
      PopperComponent={StyledPopper}
    />
  );
}
