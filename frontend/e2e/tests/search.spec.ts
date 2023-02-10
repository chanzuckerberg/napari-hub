/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { expect, test } from '@playwright/test';

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';

import { SEARCH_RESULT } from '../utils/constants';
import { parseItem, searchPluginFixture } from '../utils/fixture';
import { verifyPlugin } from '../utils/plugin';
import { searchPlugins } from '../utils/search';
import { getByTestID, selectors } from '../utils/selectors';
import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchUrl,
  getTestURL,
  maybeOpenAccordion,
} from '../utils/utils';

const query = 'video';
const pluginName = 'napari_video';
const fixture = parseItem(searchPluginFixture([query]));

test.describe('Plugin search tests', () => {
  test('should update URL parameter when entering query', async ({ page }) => {
    await searchPlugins(page, query);
    expect(getQueryParameterValues(page, SearchQueryParams.Search)).toContain(
      query,
    );
    expect(getQueryParameterValues(page, SearchQueryParams.Sort)).toContain(
      SearchSortType.Relevance,
    );
  });

  test('should render search results for query', async ({ page }) => {
    await searchPlugins(page, query);
    let index = 0;
    for (const plugin of await page.locator(getByTestID(SEARCH_RESULT)).all()) {
      await verifyPlugin(plugin, fixture[index]);
      index += 1;
    }
  });

  test('should render search results when opening URL with query', async ({
    page,
  }) => {
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]));
    let index = 0;
    for (const plugin of await page.locator(getByTestID(SEARCH_RESULT)).all()) {
      await verifyPlugin(plugin, fixture[index]);
      index += 1;
    }
  });

  test('should render original list when query is cleared', async ({
    page,
  }) => {
    await searchPlugins(page, query);
    await page.click(selectors.search.clearQueryButton);
    await expect(page.locator(selectors.search.result).first()).not.toHaveText(
      pluginName,
    );
  });

  test('should clear query when clicking on app bar home link', async ({
    page,
  }) => {
    await searchPlugins(page, query);
    await page.click(selectors.common.appBarHome);
    await expect(page.locator(selectors.search.result).first()).not.toHaveText(
      pluginName,
    );
  });

  test('should redirect to search page when searching from another page', async ({
    page,
  }) => {
    await page.goto(getTestURL('/about'));
    await searchPlugins(page, query);

    const expectedUrl = getSearchUrl(
      [SearchQueryParams.Search, query],
      [SearchQueryParams.Sort, SearchSortType.Relevance],
    );
    expect(page.url()).toContain(expectedUrl);
    await page.waitForTimeout(500);
    await expect(page.locator(selectors.search.result).first()).toContainText(
      pluginName,
    );
  });

  test('should maintain search query when navigating back', async ({
    page,
  }) => {
    await page.goto(getSearchUrl());
    await searchPlugins(page, query);
    await page.click('[data-testid=searchResult]');
    await page.waitForNavigation();

    await page.goBack();
    await page.waitForNavigation();
    await page.waitForTimeout(500);

    expect(getQueryParameterValues(page, SearchQueryParams.Search)).toContain(
      query,
    );
    await expect(page.locator(selectors.search.result).first()).toContainText(
      pluginName,
    );
  });

  test('should switch to relevance sort type when searching', async ({
    page,
    viewport,
  }) => {
    await page.goto(getSearchUrl());
    await maybeOpenAccordion(page, AccordionTitle.Sort, viewport?.width);
    await expect(page.locator(selectors.sort.selected).first()).toContainText(
      'Recently updated',
    );

    await searchPlugins(page, query);
    await expect(page.locator(selectors.sort.selected).first()).toHaveText(
      'Relevance',
    );
  });
});
