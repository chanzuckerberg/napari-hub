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
export interface OperatingSystemState {
  linux: boolean;
  mac: boolean;
  windows: boolean;
}

/**
 * Form state for filtering on python versions.
 */
export interface PythonVersionsState {
  3.7: boolean;
  3.8: boolean;
  3.9: boolean;
}

/**
 * Root state object for the filter form. Each state object is a
 * string-to-boolean map that corresponds to the form checkbox state on the
 * search page, but this may change in the future as we add more filters.
 */
export interface FilterFormState {
  developmentStatus: DevelopmentStatusFormState;
  license: LicenseFormState;
  operatingSystems: OperatingSystemState;
  pythonVersions: PythonVersionsState;
}
