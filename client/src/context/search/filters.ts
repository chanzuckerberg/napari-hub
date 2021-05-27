/**
 * Module that contains the filter function implementations used by the filter hooks.
 */

import { flow } from 'lodash';

import { FilterFormState } from './filter.types';
import { SearchResult } from './search.types';
import { SearchResultTransformFunction } from './types';

function filterByPythonVersion(
  _: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  return results;
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
