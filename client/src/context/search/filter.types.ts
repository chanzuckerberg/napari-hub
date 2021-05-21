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
 * State used for holding checked state of multiple checkboxes.
 */
export type CheckboxFormState = Record<string, boolean>;

/**
 * Root state object for the filter form. Each state object is a
 * string-to-boolean map that corresponds to the form checkbox state on the
 * search page, but this may change in the future as we add more filters.
 */
export interface FilterFormState {
  developmentStatus: DevelopmentStatusFormState;
  license: LicenseFormState;
  operatingSystems: CheckboxFormState;
  pythonVersions: CheckboxFormState;
}
