/**
 * Module that contains the filter function implementations used by the filter hooks.
 */

import { satisfies } from '@renovate/pep440';
import { flow, isEmpty } from 'lodash';

import { FilterFormState } from './filter.types';
import { SearchResult } from './search.types';
import { SearchResultTransformFunction } from './types';

function filterByPythonVersion(
  state: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  // Collect all versions selected on the filter form
  const selectedVersions = Object.entries(state.pythonVersions)
    .filter(([, enabled]) => enabled)
    .map(([version]) => version);

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

function filterByOperatingSystem(
  _: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  return results;
}

function filterByDevelopmentStatus(
  _: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  return results;
}

function filterByLicense(
  _: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  return results;
}

/**
 * List of functions to include for filtering search results.
 */
const FILTERS = [
  filterByPythonVersion,
  filterByOperatingSystem,
  filterByDevelopmentStatus,
  filterByLicense,
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
  results: SearchResult[],
  state: FilterFormState,
): SearchResult[] {
  // `flow()` will execute a list of functions and provide successive results to
  // each function:
  // https://lodash.com/docs/4.17.15#flow
  const filter: SearchResultTransformFunction = flow(
    FILTERS.map((fn) => fn.bind(null, state)),
  );

  return filter(results);
}
