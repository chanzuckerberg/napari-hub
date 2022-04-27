import styled from '@emotion/styled';
import Popper from '@material-ui/core/Popper';
import { AutocompleteRenderOptionState } from '@material-ui/lab/Autocomplete';
import clsx from 'clsx';
import {
  Button,
  ComplexFilter,
  DefaultMenuSelectOption,
  IconButton,
  InputDropdownProps,
  Tooltip,
} from 'czifui';
import { get, isEqual } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { render } from 'react-dom';
import { subscribe, useSnapshot } from 'valtio';

import {
  CheckboxIcon,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
} from '@/components/common/icons';
import { useSearchStore } from '@/store/search/context';
import { FilterKey } from '@/store/search/search.store';
import { appTheme } from '@/theme';

import styles from './PluginComplexFilter.module.scss';
import { useFilterLabels } from './useFilterLabels';
import { useFilterOptionLabels } from './useFilterOptionLabels';
import { useWorkflowStepGroups } from './useWorkflowStepGroups';

const SEARCH_ENABLED_FILTERS = new Set<FilterKey>(['workflowStep', 'authors']);

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

  /**
   * Tooltip to render with option for describing its usage.
   */
  tooltip?: string;
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

  .MuiAutocomplete-option {
    min-height: 0;
  }
`;

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

const getFirstLetter = (value: string) => value[0].toUpperCase();

/**
 * Complex filter component for filtering a specific part of the filter state.
 */
export function PluginComplexFilter({ filterKey }: Props) {
  const [t] = useTranslation(['common', 'pageTitles', 'pluginData']);
  const workflowStepGroups = useWorkflowStepGroups();
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);

  // Get dictionary that maps category keys to category names in the user's
  // language.
  const categoryNamesMap = t('pluginData:category.labels') as Record<
    string,
    string | undefined
  >;

  const filterStore = searchStore.filters[filterKey];
  const filterState = state.filters[filterKey];

  const filterOptionLabels = useFilterOptionLabels();
  const filterLabels = useFilterLabels();

  // Store options in ref to prevent re-render on options value. There's a race
  // condition issue when re-rendering ComplexFilter when `options` and
  // `pendingValue` are updated at the same time.
  const optionsRef = useRef(
    Object.keys(filterState)
      .map((stateKey) => {
        const optionLabel = filterOptionLabels[stateKey];
        const categoryName = categoryNamesMap[stateKey];

        let name = stateKey;
        let tooltip: string | undefined;

        if (optionLabel) {
          name = optionLabel.label;
          tooltip = optionLabel.tooltip;
        } else if (categoryName) {
          name = categoryName;
        }

        return {
          name,
          stateKey,
          tooltip,
        };
      })
      .sort((option1, option2) => {
        switch (filterKey) {
          case 'authors': {
            const firstLetter1 = getFirstLetter(option1.name);
            const firstLetter2 = getFirstLetter(option2.name);
            return firstLetter1.localeCompare(firstLetter2);
          }

          default:
            return 0;
        }
      }),
  );

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

              // Manually set the placeholder of the input component. This
              // workaround is required until props are added to the
              // ComplexFilter component that'll let us pass props to the nested
              // Autocomplete input component.
              const searchInput = tooltip.querySelector('input');
              if (searchInput) {
                searchInput.placeholder = 'search for a category';
              }

              // Manually replace the filter input adornment. This workaround is
              // required for the same reasons as above.
              if (filterKey === 'workflowStep') {
                const svgContainer = tooltip.querySelector(
                  '.MuiInputAdornment-root',
                );

                if (svgContainer) {
                  render(<Search />, svgContainer);
                }
              }
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
      label={filterLabels[filterKey]}
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

        groupBy: (option: PluginMenuSelectOption) => {
          switch (filterKey) {
            case 'workflowStep':
              return workflowStepGroups[option.stateKey] ?? '';

            case 'authors':
              return getFirstLetter(option.name);

            default:
              return null;
          }
        },
        renderOption: (
          option: PluginMenuSelectOption,
          { selected }: AutocompleteRenderOptionState,
        ) => (
          <div className="flex flex-auto justify-between py-1 px-4">
            <div className="flex space-x-2">
              <CheckboxIcon
                className="min-w-[0.875rem] min-h-[0.875rem]"
                checked={selected}
              />

              <p
                className={clsx(
                  '-mt-1 text-[0.875rem] break-words leading-normal',
                  selected && 'text-black',
                )}
              >
                {option.name}
              </p>
            </div>

            {option.tooltip && (
              <Tooltip
                interactive={false}
                leaveDelay={0}
                title={
                  <div>
                    <p className="font-semibold text-[0.6875rem] screen-495:text-xs">
                      {option.name}
                    </p>

                    <span className="text-[0.5625rem] screen-495:text-[0.6875rem]">
                      {option.tooltip}
                    </span>
                  </div>
                }
              >
                <IconButton>
                  <Info />
                </IconButton>
              </Tooltip>
            )}
          </div>
        ),
      }}
      options={optionsRef.current}
      value={pendingState}
      PopperComponent={StyledPopper}
    />
  );
}
