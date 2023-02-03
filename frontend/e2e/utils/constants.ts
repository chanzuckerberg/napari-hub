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

export const AUTHORS: Record<string, Array<Array<string>>> = {
  LOCAL: [['Talley Lambert']],
  STAGING: [['Abigail McGovern']],
  PROD: [['Abigail McGovern']],
};
