import { Page } from 'playwright';

import { selectors } from '@/tests/selectors';

/**
 * Submits a new search query into the search bar.
 *
 * @param query The query string.
 */
export async function submitQuery(page: Page, query: string) {
  const selector = selectors.search.searchInput;
  await page.fill(selector, query);
  await page.press(selector, 'Enter');
}
