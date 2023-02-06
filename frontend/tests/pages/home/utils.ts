import { SEARCH_PAGE } from '@/store/search/constants';
import { breakpoints } from '@/theme/breakpoints';

/**
 * @returns The first search result name.
 */
export function getFirstSearchResultName() {
  return page.$('[data-testid=searchResultDisplayName]:visible');
}

export function getSearchResultNames() {
  return page.$$('[data-testid=searchResultDisplayName]:visible');
}

/**
 * Creates a URL to the home page with query parameters if provided. Each query
 * parameter should be a tuple containing the key and value.
 *
 * @param params A list of query parameters.
 * @returns The search URL.
 */
export function getSearchUrl(...params: string[][]) {
  const url = new URL(SEARCH_PAGE, 'http://localhost:8080');

  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}

/**
 * @param name The query parameter to extract values from.
 * @returns A list of query parameter values.
 */
export function getQueryParameterValues(name: string) {
  const url = new URL(page.url());
  return url.searchParams.getAll(name);
}

/**
 * Submits a new search query into the search bar.
 *
 * @param query The query string.
 */
export async function submitQuery(query: string) {
  await page.fill('[data-testid=searchBarInput]', query);
  await page.press('[data-testid=searchBarInput]', 'Enter');
}

/**
 * @returns The currently selected sort radio.
 */
export async function getSelectedSortByRadio() {
  return page.$('[data-testid=sortByRadio][data-selected=true]');
}

export enum MetadataLabel {
  Version = 'version',
  ReleaseDate = 'releaseDate',
  License = 'license',
  PythonVersion = 'Python version',
  OperatingSystem = 'operating system',
}

/**
 * Returns a list of search result metadata values given the name of the value.
 *
 * @param label The metadata label to fetch from.
 * @returns The list of metadata values.
 */
export async function getSearchResultMetadata(label: MetadataLabel) {
  const result: string[] = [];

  const searchResultMetadata = await page.$$(
    '[data-testid=searchResultMetadata]',
  );

  // Collect all values for a particular metadata label.
  await Promise.all(
    searchResultMetadata.map(async (metadata) => {
      const resultLabel = await metadata.getAttribute('data-label');
      const value = await metadata.getAttribute('data-value');

      if (resultLabel === label && value) {
        result.push(value);
      }
    }),
  );

  return result;
}

export enum AccordionTitle {
  FilterByRequirement = 'Filter by requirement',
  FilterByCategory = 'Filter by category',
  Sort = 'Sort',
}

/**
 * Opens an accordion on the search page if the screen is small enough to render
 * an accordion.
 *
 * @param title The title of the accordion to open.
 */
export async function maybeOpenAccordion(title: AccordionTitle) {
  const width = deviceName?.split('-')?.[1] ?? 0;
  if (width < breakpoints['screen-875']) {
    await page.click(`[data-testid=accordionSummary][data-title="${title}"]`);
  }
}
