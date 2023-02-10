export const ENVIRONMENT = {
  DEV: 'dev',
};

export const API: Record<string, string> = {
  STAGING: 'https://api.staging.napari-hub.org/',
  PROD: 'https://api.napari-hub.org',
};

export const SEARCH_RESULT = 'pluginSearchResult';
export const RESULT_NAME = 'searchResultName';
export const DISPLAY_NAME = 'searchResultDisplayName';
export const RESULT_SUMMARY = 'searchResultSummary';
export const RESULT_WORKFLOW_STEPS = '.css-9iedg7';
export const RESULT_TYPE = 'Plugin type';
export const RESULT_RELEASE_DATE = 'Release date';
export const RESULT_VERSION = 'Version';
export const RESULT_AUTHORS = 'searchResultAuthor';
export const PAGINATION_VALUE = 'paginationValue';
export const PAGINATION_LEFT = 'paginationLeft';
export const PAGINATION_RIGHT = 'paginationRight';
export const SEARCH_INPUT = 'searchBarInput';
export const SEARCH_BUTTON = 'submitQueryButton';
export const CLEAR_SEARCH = 'clearQueryButton';
export const PLUGIN_NAME = 'metadata-displayName';
export const PLUGIN_SUMMARY = 'metadata-summary';
export const CONTRIBUTING = 'contributing';
export const LICENSE = 'license';
export const ISSUES = 'issues';
export const METADATA_VERSION = 'metadata-version';
export const METADATA_RELEASE_DATE = 'metadata-releaseDate';
export const METADATA_FIRST_RELEASED = 'metadata-firstReleased';
export const METADATA_LICENSE = 'metadata-license';
export const METADATA_SUPPORTED_DATA = 'metadata-supportedData';
export const MEATADATA_PLUGIN_TYPE = 'metadata-pluginType';
export const MEATADATA_PYTHON_VERSION = 'metadata-pythonVersion';
export const METADATA_OPERATING_SYSTEM = 'metadata-operatingSystems';
export const METADATA_REQUIREMENTS = 'metadata-requirements';
export const AUTHOR = 'a[href*="/?authors"]';
export const CONT = 'Contributing¶';
export const CONTRIBUTING_HEADER = 'Contributing¶';
export const LICENSE_HEADER = 'License¶';
export const ISSUES_HEADER = 'Issues¶';
export const SUPPORTED_DATA = 'Supported data:';
export const PLUGIN_TYPE = 'Plugin type';
export const REQUIREMENT = 'Requirements:';
export const HEADER_REGION = '.overflow-x-auto';
export const ACTIVITY = 'Activity';
export const BODY_ACTIVITY_PAGE = '[class="min-h-[200px]"]';
export const USAGE = 'Usage';
export const INSTALL = 'Install';
export const SIDE_BAR = '.sticky';
export const BUTTON = 'button';

export const AUTHORS: Record<string, Array<Array<string>>> = {
  LOCAL: [['Talley Lambert'], ['Carsen Stringer', 'Manan Lalit']],
  STAGING: [['Abigail McGovern']],
  PROD: [['Abigail McGovern']],
};
