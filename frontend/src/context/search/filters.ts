/**
 * Module that contains the filter function implementations used by the filter hooks.
 */

import { satisfies } from '@renovate/pep440';
import { useAtom } from 'jotai';
import { flow, intersection, isEmpty, some } from 'lodash';

import { osiApprovedLicenseSetState } from '@/store/spdx';

import { FilterFormState, OperatingSystemFormState } from './filter.types';
import { SearchResult } from './search.types';
import { SearchResultTransformFunction } from './types';

function useFilterByPythonVersion(
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

const FILTER_OS_PATTERN: Record<keyof OperatingSystemFormState, RegExp> = {
  linux: /Linux/,
  mac: /MacOS/,
  windows: /Windows/,
};

function useFilterByOperatingSystem(
  state: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  return results.filter(({ plugin }) => {
    // Don't filter if plugin supports all operating systems
    if (plugin.operating_system.some((os) => os.includes('OS Independent'))) {
      return true;
    }

    // Don't filter if none of the checkboxes are enabled
    if (!some(state.operatingSystems, (enabled) => enabled)) {
      return true;
    }

    return plugin.operating_system.some((os) =>
      some(state.operatingSystems, (enabled, osKey) => {
        if (enabled) {
          const pattern =
            FILTER_OS_PATTERN[osKey as keyof OperatingSystemFormState];

          return !!pattern.exec(os);
        }

        return false;
      }),
    );
  });
}

const STABLE_DEV_STATUS = [
  'Development Status :: 5 - Production/Stable',
  'Development Status :: 6 - Mature',
];

function useFilterByDevelopmentStatus(
  state: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  if (!state.developmentStatus.onlyStablePlugins) {
    return results;
  }

  // Filter plugins that include at least one of the stable dev statuses.
  return results.filter(
    ({ plugin }) =>
      !isEmpty(intersection(STABLE_DEV_STATUS, plugin.development_status)),
  );
}

function useFilterByLicense(
  state: FilterFormState,
  results: SearchResult[],
): SearchResult[] {
  const [licenseSet] = useAtom(osiApprovedLicenseSetState);

  if (!state.license.onlyOpenSourcePlugins) {
    return results;
  }

  return results.filter(({ plugin }) => licenseSet.has(plugin.license));
}

/**
 * List of functions to include for filtering search results.
 */
const FILTERS = [
  useFilterByPythonVersion,
  useFilterByOperatingSystem,
  useFilterByDevelopmentStatus,
  useFilterByLicense,
];

/**
 * Executes all filter functions on the search results with each result passed
 * to the next function.
 *
 * @param results The search results
 * @param state The filter form state
 * @returns The filtered search results
 */
export function useFilterResults(
  results: SearchResult[],
  state: FilterFormState,
): SearchResult[] {
  // `flow()` will execute a list of functions and provide successive results to
  // each function:
  // https://lodash.com/docs/4.17.15#flow
  const useFilter: SearchResultTransformFunction = flow(
    FILTERS.map((fn) => fn.bind(null, state)),
  );

  return useFilter(results);
}
