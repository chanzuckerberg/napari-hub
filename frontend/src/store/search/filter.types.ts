/**
 * Form state for filtering on plugin development status.
 */
export interface DevelopmentStatusFormState {
  onlyStablePlugins: boolean;
}

/**
 * Form state for filtering on plugin license.
 */
export interface LicenseFormState {
  onlyOpenSourcePlugins: boolean;
}

/**
 * Form state for filtering on operating systems.
 */
export interface OperatingSystemFormState {
  linux: boolean;
  mac: boolean;
  windows: boolean;
}

export type PythonVersionFormState = Record<string, boolean>;

/**
 * Root state object for the filter form. Each state object is a
 * string-to-boolean map that corresponds to the form checkbox state on the
 * search page, but this may change in the future as we add more filters.
 */
export interface FilterFormState {
  developmentStatus: DevelopmentStatusFormState;
  license: LicenseFormState;
  operatingSystems: OperatingSystemFormState;
  pythonVersions: PythonVersionFormState;
}

/**
 * Form state for rendering filters in a chip / pill above the plugin search results.
 */
export interface FilterChipFormState {
  id: string;
  key: keyof FilterFormState;
  subKey: string;
  value: boolean;
}
