import styled from '@emotion/styled';
import { AutocompleteRenderOptionState } from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import clsx from 'clsx';
import {
  Button,
  ComplexFilter,
  DefaultMenuSelectOption,
  DropdownPopper,
  InputDropdownProps,
  Tooltip,
} from 'czifui';
import { get, isEqual } from 'lodash';
import { useTranslation } from 'next-i18next';
import {
  ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { subscribe, useSnapshot } from 'valtio';

import { CheckboxIcon, ChevronDown, ChevronUp, Info } from '@/components/icons';
import { useSearchStore } from '@/store/search/context';
import { FilterKey } from '@/store/search/search.store';
import { theme } from '@/theme';

import styles from './PluginComplexFilter.module.scss';
import { useFilterLabels } from './useFilterLabels';
import { useFilterOptionLabels } from './useFilterOptionLabels';
import { useWorkflowStepGroups } from './useWorkflowStepGroups';

/**
 * Metadata filters that should have a search bar.
 */
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

function Popper({
  className,
  ...props
}: ComponentProps<typeof DropdownPopper>) {
  return (
    <DropdownPopper className={clsx(className, styles.popper)} {...props} />
  );
}

const StyledPopper = styled(Popper)`
  background: #fff;
  box-shadow: ${theme.shadows[10]};
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
  width: 100%;

  max-width: calc(100vw - 50px - 8px);

  @media (min-width: 495px) {
    max-width: calc(100vw - 100px - 16px);
  }

  @media (min-width: 875px) {
    max-width: calc(225px);
  }

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
    <div className="border-b border-black">
      <Button
        {...props}
        className="text-black w-full flex justify-between p-0 pb-2"
      >
        <span className="font-semibold text-sm">{label}</span>
        {sdsStage === 'default' && (
          <ChevronDown className={iconSizeClassName} />
        )}
        {sdsStage === 'userInput' && (
          <ChevronUp className={iconSizeClassName} />
        )}
      </Button>
    </div>
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
          // Sort authors alphabetically.
          case 'authors': {
            return option1.name.localeCompare(option2.name);
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

  return (
    <ComplexFilter
      className={clsx(
        'py-2 hover:bg-hub-gray-100',
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
      DropdownMenuProps={{
        PopperBaseProps: {
          // className: 'bg-red-100',
        },

        classes: {
          groupLabel: clsx(
            '!text-sm leading-normal text-black font-semibold top-0 px-2',
            'tracking-normal normal-case',

            !(filterKey === 'workflowStep' || filterKey === 'authors') &&
              'hidden',
          ),

          root: clsx(styles.autoComplete, isSearchEnabled && 'mb-sds-l'),

          noOptions: 'text-sm',
        },

        noOptionsText: 'No categories',

        // Data attribute used for querying the tooltip for the current filter.
        'data-filter': filterKey,

        groupBy: (option: PluginMenuSelectOption) => {
          switch (filterKey) {
            case 'workflowStep':
              return workflowStepGroups[option.stateKey] ?? '';

            case 'authors':
              // Use first letter of name for author grouping.
              return getFirstLetter(option.name);

            default:
              return null;
          }
        },

        renderOption: (
          optionProps: Record<string, unknown>,
          option: PluginMenuSelectOption,
          { selected }: AutocompleteRenderOptionState,
        ) => (
          <div
            {...optionProps}
            className={clsx(
              'flex flex-auto justify-between p-2',
              'cursor-pointer hover:bg-hub-gray-100',
            )}
          >
            <div className="flex space-x-sds-s">
              <CheckboxIcon
                className="min-w-[0.875rem] min-h-[0.875rem]"
                checked={selected}
              />

              <p
                className={clsx(
                  '-mt-sds-xxs text-[0.875rem] break-words leading-normal tracking-normal',
                  selected && 'text-black',
                )}
              >
                {option.name}
              </p>
            </div>

            {option.tooltip && (
              <Tooltip
                disableInteractive
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
      options={optionsRef.current.filter(
        (option) => option.name && option.stateKey,
      )}
      value={pendingState}
      PopperComponent={StyledPopper}
    />
  );
}
