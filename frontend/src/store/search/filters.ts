/**
 * Module that contains the filter function implementations used by the filter hooks.
 */

import { satisfies } from '@renovate/pep440';
import { flow, intersection, isArray, isEmpty, some } from 'lodash';

import { DeriveGet, HubDimension } from '@/types';

import { searchFormStore } from './form.store';
import { SearchResult } from './search.types';
import { SearchResultTransformFunction } from './types';

function getSelectedKeys(state: Record<string, boolean>): string[] {
  return Object.entries(state)
    .filter(([, enabled]) => enabled)
    .map(([version]) => version);
}

function filterByPythonVersion(
  get: DeriveGet,
  results: SearchResult[],
): SearchResult[] {
  const state = get(searchFormStore).filters.pythonVersions;

  // Collect all versions selected on the filter form
  const selectedVersions = getSelectedKeys(state);
  if (isEmpty(selectedVersions)) {
    return results;
  }

  // Filter results that satisfy the enabled versions
  return results.filter(({ plugin }) =>
    selectedVersions.some((version) =>
      // Plugin version can be a specifier, so we need to check if any of the
      // selected versions match the plugin specifier.
      satisfies(version, plugin.python_version),
    ),
  );
}

const FILTER_OS_PATTERN = {
  linux: /Linux/,
  mac: /MacOS/,
  windows: /Windows/,
};

function filterByOperatingSystem(
  get: DeriveGet,
  results: SearchResult[],
): SearchResult[] {
  const state = get(searchFormStore).filters.operatingSystems;

  return results.filter(({ plugin }) => {
    // Don't filter if plugin supports all operating systems
    if (
      isArray(plugin.operating_system) &&
      plugin.operating_system.some((os) => os.includes('OS Independent'))
    ) {
      return true;
    }

    // Don't filter if none of the checkboxes are enabled
    if (!some(state, (enabled) => enabled)) {
      return true;
    }

    return (
      isArray(plugin.operating_system) &&
      plugin.operating_system.some((os) =>
        some(state, (enabled, osKey) => {
          if (enabled) {
            const pattern =
              FILTER_OS_PATTERN[osKey as keyof typeof FILTER_OS_PATTERN];

            return !!pattern.exec(os);
          }

          return false;
        }),
      )
    );
  });
}

const STABLE_DEV_STATUS = [
  'Development Status :: 5 - Production/Stable',
  'Development Status :: 6 - Mature',
];

function filterByDevelopmentStatus(
  get: DeriveGet,
  results: SearchResult[],
): SearchResult[] {
  const state = get(searchFormStore).filters.devStatus;

  if (state.stable) {
    // Filter plugins that include at least one of the stable dev statuses.
    return results.filter(
      ({ plugin }) =>
        !isEmpty(intersection(STABLE_DEV_STATUS, plugin.development_status)),
    );
  }

  return results;
}

function filterByLicense(
  get: DeriveGet,
  results: SearchResult[],
): SearchResult[] {
  const state = get(searchFormStore).filters.license;

  if (state.openSource) {
    return results.filter(({ plugin }) =>
      state.osiApprovedLicenseSet.has(plugin.license),
    );
  }

  return results;
}

interface CreateCategoryFilterOptions {
  dimension: HubDimension;
  getState: (get: DeriveGet) => Record<string, boolean>;
}

/**
 * Helper for creating category filter functions. Generally this allows us to
 * create functions that check if the selected category terms match whatever is
 * in the plugin for a particular category dimension.
 */
function createCategoryFilter({
  dimension,
  getState,
}: CreateCategoryFilterOptions) {
  return (get: DeriveGet, results: SearchResult[]) => {
    const state = getState(get);

    // Check if the user enabled any of the filters. Return early otherwise.
    const selectedKeys = getSelectedKeys(state);
    if (isEmpty(selectedKeys)) {
      return results;
    }

    // Return plugins that include at least one selected category.
    return results.filter(
      ({ plugin }) =>
        !isEmpty(
          intersection(
            plugin.category ? plugin.category[dimension] : [],
            selectedKeys,
          ),
        ),
    );
  };
}

const filterByWorkflowStep = createCategoryFilter({
  getState: (get) => get(searchFormStore).filters.workflowStep,
  dimension: 'Workflow step',
});

const filterByImageModality = createCategoryFilter({
  getState: (get) => get(searchFormStore).filters.imageModality,
  dimension: 'Image modality',
});

const filterBySupportedData = createCategoryFilter({
  getState: (get) => get(searchFormStore).filters.supportedData,
  dimension: 'Supported data',
});

const FILTERS = [
  filterByPythonVersion,
  filterByOperatingSystem,
  filterByDevelopmentStatus,
  filterByLicense,
  filterByWorkflowStep,
  filterByImageModality,
  filterBySupportedData,
];

/**
 * Executes all filter functions on the search results with each result passed
 * to the next function.
 *
 * @param results The search results
 * @param state The filter form state
 * @returns The filtered search results
 */
export function filterResults(
  get: DeriveGet,
  results: SearchResult[],
): SearchResult[] {
  // `flow()` will execute a list of functions and provide successive results to
  // each function:
  // https://lodash.com/docs/4.17.15#flow
  const filter: SearchResultTransformFunction = flow(
    FILTERS.map((fn) => fn.bind(null, get)),
  );

  return filter(results);
}
