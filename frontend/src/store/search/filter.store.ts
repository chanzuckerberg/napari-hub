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

import { ClassState, HubDimension, PluginIndexData, PluginType } from '@/types';

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

type FilterState<K extends string> = Record<K, boolean>;

const DEFAULT_PLUGIN_TYPE_STATE = Object.values(PluginType).reduce(
  (state, pluginType) => set(state, pluginType, false),
  {} as Partial<FilterState<PluginType>>,
) as FilterState<PluginType>;

export class SearchFilterStore implements Resettable {
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

  supportedData: FilterState<string> = {};

  workflowStep: FilterState<string> = {};

  imageModality: FilterState<string> = {};

  pluginType: FilterState<PluginType> = DEFAULT_PLUGIN_TYPE_STATE;

  writerFileExtensions: FilterState<string> = {};

  readerFileExtensions: FilterState<string> = {};

  authors: FilterState<string> = {};

  private osiApprovedLicenseSet = new Set<string>();

  constructor(
    initialState: DeepPartial<ClassState<SearchFilterStore>> = {},
    index: PluginIndexData[] = [],
    licenses: SpdxLicenseData[] = [],
  ) {
    merge(this, initialState);
    this.initOsiApprovedLicenseSet(licenses);
    this.initCategoryFilters(index);
    this.initFileExtensionFilters(index);
    this.initAuthorFilter(index);
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
      this.filterByLicense,
      this.filterByWorkflowStep,
      this.filterByImageModality,
      this.filterBySupportedData,
      this.filterByPluginType,
      this.filterByReaderFileExtensions,
      this.filterByWriterFileExtensions,
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

  private initAuthorFilter(index: PluginIndexData[]) {
    index.forEach(
      (plugin) =>
        isArray(plugin.authors) &&
        plugin.authors.forEach((author) => {
          this.authors[author.name] = false;
        }),
    );
  }

  private initFileExtensionFilters(index: PluginIndexData[]): void {
    function addToState(state: FilterState<string>, keys: string[]) {
      for (const key of keys) {
        // eslint-disable-next-line no-param-reassign
        state[key] = false;
      }
    }

    for (const plugin of index) {
      if (
        plugin.reader_file_extensions &&
        plugin.plugin_types?.includes(PluginType.Reader)
      ) {
        addToState(
          this.readerFileExtensions,
          plugin.reader_file_extensions.sort(),
        );
      }

      if (
        plugin.writer_file_extensions &&
        plugin.plugin_types?.includes(PluginType.Writer)
      ) {
        addToState(
          this.writerFileExtensions,
          plugin.writer_file_extensions.sort(),
        );
      }
    }
  }

  private initOsiApprovedLicenseSet(licenses: SpdxLicenseData[]) {
    licenses
      .filter((license) => license.isOsiApproved)
      .forEach((license) => this.osiApprovedLicenseSet.add(license.licenseId));
  }

  private getSelectedKeys(state: FilterState<string>): string[] {
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

  private filterByPluginType(results: SearchResult[]): SearchResult[] {
    const selected = new Set(this.getSelectedKeys(this.pluginType));
    if (selected.size === 0) {
      return results;
    }

    return results.filter((result) =>
      result.plugin.plugin_types?.some((value) => selected.has(value)),
    );
  }

  private filterByReaderFileExtensions(
    results: SearchResult[],
  ): SearchResult[] {
    const selected = new Set(this.getSelectedKeys(this.readerFileExtensions));
    if (selected.size === 0) {
      return results;
    }

    return results
      .filter((result) =>
        result.plugin.plugin_types?.includes(PluginType.Reader),
      )
      .filter((result) =>
        result.plugin.reader_file_extensions?.some((value) =>
          selected.has(value),
        ),
      );
  }

  private filterByWriterFileExtensions(
    results: SearchResult[],
  ): SearchResult[] {
    const selected = new Set(this.getSelectedKeys(this.writerFileExtensions));
    if (selected.size === 0) {
      return results;
    }

    return results
      .filter((result) =>
        result.plugin.plugin_types?.includes(PluginType.Writer),
      )
      .filter((result) =>
        result.plugin.writer_file_extensions?.some((value) =>
          selected.has(value),
        ),
      );
  }
}
