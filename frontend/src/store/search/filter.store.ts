import { satisfies } from '@renovate/pep440';
import {
  flow,
  intersection,
  isArray,
  isEmpty,
  isFunction,
  merge,
  set,
  some,
} from 'lodash';
import { DeepPartial, NonFunctionKeys } from 'utility-types';

import { ClassState, HubDimension, PluginIndexData } from '@/types';

import { SearchResult } from './search.types';
import {
  Resettable,
  SearchResultTransformFunction,
  SpdxLicenseData,
} from './types';

const FILTER_OS_PATTERN = {
  linux: /Linux/,
  mac: /MacOS/,
  windows: /Windows/,
};

const STABLE_DEV_STATUS = [
  'Development Status :: 5 - Production/Stable',
  'Development Status :: 6 - Mature',
];

export class SearchFilterStore implements Resettable {
  devStatus = {
    stable: false,
  };

  license = {
    openSource: false,
  };

  operatingSystems = {
    linux: false,
    mac: false,
    windows: false,
  };

  pythonVersions = {
    3.7: false,
    3.8: false,
    3.9: false,
  };

  supportedData: Record<string, boolean> = {};

  workflowStep: Record<string, boolean> = {};

  imageModality: Record<string, boolean> = {};

  private osiApprovedLicenseSet = new Set<string>();

  constructor(
    initialState: DeepPartial<ClassState<SearchFilterStore>> = {},
    index: PluginIndexData[] = [],
    licenses: SpdxLicenseData[] = [],
  ) {
    merge(this, initialState);
    this.initOsiApprovedLicenseSet(licenses);
    this.initCategoryFilters(index);
  }

  reset() {
    const filterKeys = Object.entries(this)
      .filter(([, value]) => !isFunction(value))
      .map(([key]) => key) as NonFunctionKeys<SearchFilterStore>[];

    for (const filterKey of filterKeys) {
      for (const stateKey of Object.keys(this[filterKey])) {
        set(this, [filterKey, stateKey], false);
      }
    }
  }

  filterResults(results: SearchResult[]): SearchResult[] {
    const filters = [
      this.filterByPythonVersion,
      this.filterByOperatingSystem,
      this.filterByDevelopmentStatus,
      this.filterByLicense,
      this.filterByWorkflowStep,
      this.filterByImageModality,
      this.filterBySupportedData,
    ].map((fn) => fn.bind(this));

    // `flow()` will execute a list of functions and provide successive results to
    // each function:
    // https://lodash.com/docs/4.17.15#flow
    const filter: SearchResultTransformFunction = flow(filters);
    return filter(results);
  }

  private initCategoryFilters(index: PluginIndexData[]): void {
    /**
     * Map of hub dimensions to their corresponding UI state.
     */
    const categoryFilterStates: Record<
      HubDimension,
      Record<string, boolean>
    > = {
      'Image modality': this.imageModality,
      'Supported data': this.supportedData,
      'Workflow step': this.workflowStep,
    };

    for (const plugin of index) {
      if (plugin?.category) {
        for (const [dimension, keys] of Object.entries(plugin.category)) {
          const state = categoryFilterStates[dimension as HubDimension];

          for (const key of keys) {
            if (key) {
              state[key] = false;
            }
          }
        }
      }
    }
  }

  private initOsiApprovedLicenseSet(licenses: SpdxLicenseData[]) {
    licenses
      .filter((license) => license.isOsiApproved)
      .forEach((license) => this.osiApprovedLicenseSet.add(license.licenseId));
  }

  private getSelectedKeys(state: Record<string, boolean>): string[] {
    return Object.entries(state)
      .filter(([, enabled]) => enabled)
      .map(([version]) => version);
  }

  private filterByPythonVersion(results: SearchResult[]): SearchResult[] {
    const state = this.pythonVersions;

    // Collect all versions selected on the filter form
    const selectedVersions = this.getSelectedKeys(state);
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

  private filterByOperatingSystem(results: SearchResult[]): SearchResult[] {
    const state = this.operatingSystems;

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

  private filterByDevelopmentStatus(results: SearchResult[]): SearchResult[] {
    const state = this.devStatus;

    if (state.stable) {
      // Filter plugins that include at least one of the stable dev statuses.
      return results.filter(
        ({ plugin }) =>
          !isEmpty(intersection(STABLE_DEV_STATUS, plugin.development_status)),
      );
    }

    return results;
  }

  private filterByLicense(results: SearchResult[]): SearchResult[] {
    const state = this.license;

    if (state.openSource) {
      return results.filter(({ plugin }) =>
        this.osiApprovedLicenseSet.has(plugin.license),
      );
    }

    return results;
  }

  /**
   * Helper for creating category filter functions. Generally this allows us to
   * create functions that check if the selected category terms match whatever is
   * in the plugin for a particular category dimension.
   */
  private filterCategory(
    dimension: HubDimension,
    state: Record<string, boolean>,
    results: SearchResult[],
  ): SearchResult[] {
    // Check if the user enabled any of the filters. Return early otherwise.
    const selectedKeys = this.getSelectedKeys(state);
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
  }

  private filterByWorkflowStep(results: SearchResult[]): SearchResult[] {
    return this.filterCategory('Workflow step', this.workflowStep, results);
  }

  private filterByImageModality(results: SearchResult[]): SearchResult[] {
    return this.filterCategory('Image modality', this.imageModality, results);
  }

  private filterBySupportedData(results: SearchResult[]): SearchResult[] {
    return this.filterCategory('Supported data', this.supportedData, results);
  }
}
