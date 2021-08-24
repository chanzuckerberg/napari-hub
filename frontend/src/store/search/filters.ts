/**
 * Module that contains the filter function implementations used by the filter hooks.
 */

import { satisfies } from '@renovate/pep440';
import { Getter } from 'jotai';
import { flow, intersection, isEmpty, some } from 'lodash';

import { osiApprovedLicenseSetState } from '@/store/spdx';

import {
  filterLinuxState,
  filterMacState,
  filterOnlyOpenSourcePluginsState,
  filterOnlyStablePluginsState,
  filterPython37State,
  filterPython38State,
  filterPython39State,
  filterWindowsState,
} from './filter.state';
import { SearchResult } from './search.types';
import { SearchResultTransformFunction } from './types';

function filterByPythonVersion(
  get: Getter,
  results: SearchResult[],
): SearchResult[] {
  const versionCheckboxState = {
    3.7: get(filterPython37State),
    3.8: get(filterPython38State),
    3.9: get(filterPython39State),
  };

  // Collect all versions selected on the filter form
  const selectedVersions = Object.entries(versionCheckboxState)
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

const FILTER_OS_PATTERN = {
  linux: /Linux/,
  mac: /MacOS/,
  windows: /Windows/,
};

function filterByOperatingSystem(
  get: Getter,
  results: SearchResult[],
): SearchResult[] {
  const operatingSystemCheckboxStates = {
    linux: get(filterLinuxState),
    mac: get(filterMacState),
    windows: get(filterWindowsState),
  };

  return results.filter(({ plugin }) => {
    // Don't filter if plugin supports all operating systems
    if (plugin.operating_system.some((os) => os.includes('OS Independent'))) {
      return true;
    }

    // Don't filter if none of the checkboxes are enabled
    if (!some(operatingSystemCheckboxStates, (enabled) => enabled)) {
      return true;
    }

    return plugin.operating_system.some((os) =>
      some(operatingSystemCheckboxStates, (enabled, osKey) => {
        if (enabled) {
          const pattern =
            FILTER_OS_PATTERN[osKey as keyof typeof FILTER_OS_PATTERN];

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

function filterByDevelopmentStatus(
  get: Getter,
  results: SearchResult[],
): SearchResult[] {
  const onlyStablePlugins = get(filterOnlyStablePluginsState);

  if (onlyStablePlugins) {
    // Filter plugins that include at least one of the stable dev statuses.
    return results.filter(
      ({ plugin }) =>
        !isEmpty(intersection(STABLE_DEV_STATUS, plugin.development_status)),
    );
  }

  return results;
}

function filterByLicense(get: Getter, results: SearchResult[]): SearchResult[] {
  const onlyOpenSourcePlugins = get(filterOnlyOpenSourcePluginsState);
  const licenseSet = get(osiApprovedLicenseSetState);

  if (onlyOpenSourcePlugins) {
    return results.filter(({ plugin }) => licenseSet.has(plugin.license));
  }

  return results;
}

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
  get: Getter,
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
