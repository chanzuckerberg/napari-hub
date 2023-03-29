import { Page } from '@playwright/test';

import { SEARCH_PAGE, SearchQueryParams } from '@/store/search/constants';
import { breakpoints } from '@/theme/breakpoints';

export const TEST_URL = process.env.BASEURL || 'http://localhost:8080';

export enum MetadataLabel {
  Version = 'version',
  ReleaseDate = 'releaseDate',
  License = 'license',
  PythonVersion = 'Python version',
  OperatingSystem = 'operating system',
}

export enum AccordionTitle {
  FilterByRequirement = 'Filter by requirement',
  FilterByCategory = 'Filter by category',
  Sort = 'Sort',
}

export function getTestURL(pathname: string) {
  const url = new URL(pathname, TEST_URL);
  return url.href;
}

/**
 * Creates a URL to the home page with query parameters if provided. Each query
 * parameter should be a tuple containing the key and value.
 *
 * @param params A list of query parameters.
 * @returns The search URL.
 */
export function getSearchUrl(...params: string[][]) {
  const url = new URL(SEARCH_PAGE, TEST_URL);

  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }

  return url.href;
}

export function hasPageQueryParameter(page: Page, pageValue: number) {
  const url = new URL(page.url());
  return +(url.searchParams.get(SearchQueryParams.Page) ?? 0) === pageValue;
}

/**
 * @param name The query parameter to extract values from.
 * @returns A list of query parameter values.
 */
export function getQueryParameterValues(page: Page, name: string) {
  const url = new URL(page.url());
  return url.searchParams.getAll(name);
}

/**
 * Opens an accordion on the search page if the screen is small enough to render
 * an accordion.
 *
 * @param title The title of the accordion to open.
 */
export async function maybeOpenAccordion(
  page: Page,
  title: AccordionTitle,
  width = Infinity,
) {
  if (width < breakpoints['screen-875']) {
    await page.getByRole('button', { name: title }).click();
    await page.waitForTimeout(1000);
  }
}
export async function maybeExpand(page: Page, width = Infinity) {
  if (width < breakpoints['screen-725']) {
    await page.locator('[data-title="Sort"]').click();
    await page.locator('[data-title="Filter by category"]').click();
    await page.locator('[data-title="Filter by requirement"]').click();
  }
}
