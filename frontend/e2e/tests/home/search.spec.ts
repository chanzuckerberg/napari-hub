import { expect, test } from '@playwright/test';

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';

import { searchPlugins } from '../../utils/search';
import { selectors } from '../../utils/selectors';
import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchUrl,
  getTestURL,
  maybeOpenAccordion,
} from '../../utils/utils';

test.describe('Plugin search', () => {
  test('should update URL parameter when entering query', async ({ page }) => {
    const query = 'video';
    await page.goto(getSearchUrl(), { timeout: 60000 });
    await searchPlugins(page, query);
    expect(getQueryParameterValues(page, SearchQueryParams.Search)).toContain(
      query,
    );
    expect(getQueryParameterValues(page, SearchQueryParams.Sort)).toContain(
      SearchSortType.Relevance,
    );
  });

  test('should render search results for query', async ({ page }) => {
    await page.goto(getSearchUrl(), { timeout: 60000 });
    await searchPlugins(page, 'video');
    await expect(page.locator(selectors.search.result)).toContainText(
      'napari_video',
    );
  });

  test('should render search results when opening URL with query', async ({
    page,
  }) => {
    await page.goto(getSearchUrl([SearchQueryParams.Search, 'video']), {
      timeout: 60000,
    });
    await expect(page.locator(selectors.search.result)).toHaveText(
      'napari_video',
    );
  });

  test('should render original list when query is cleared', async ({
    page,
  }) => {
    await page.goto(getSearchUrl([SearchQueryParams.Search, 'video']), {
      timeout: 60000,
    });
    await page.click(selectors.search.clearQueryButton);
    await expect(page.locator(selectors.search.result).first()).not.toHaveText(
      'napari_video',
    );
  });

  test('should clear query when clicking on app bar home link', async ({
    page,
    viewport,
  }) => {
    await page.goto(getSearchUrl([SearchQueryParams.Search, 'video']), {
      timeout: 60000,
    });

    // eslint-disable-next-line playwright/no-conditional-in-test
    if ((viewport?.width ?? 0) < 600) {
      await page.click(selectors.common.mobileMenuButton);
    }

    await page.click(selectors.common.plugins);
    await page.waitForURL('/plugins');
    await expect(page.locator(selectors.search.result).first()).not.toHaveText(
      'napari_video',
    );
  });

  test('should redirect to search page when searching from another page', async ({
    page,
  }) => {
    await page.goto(getTestURL('/about'), { timeout: 60000 });
    await searchPlugins(page, 'video');

    const expectedUrl = getSearchUrl(
      [SearchQueryParams.Search, 'video'],
      [SearchQueryParams.Sort, SearchSortType.Relevance],
    );
    expect(page.url()).toContain(expectedUrl);
    await page.waitForTimeout(500);
    await expect(page.locator(selectors.search.result).first()).toContainText(
      'napari_video',
    );
  });

  // TODO refactor state for search or remove when search API is implemented
  // test('should maintain search query when navigating back', async ({
  //   page,
  // }) => {
  //   const query = 'video';
  //   await page.goto(getSearchUrl(), { timeout: 60000 });
  //   await searchPlugins(page, query);
  //   await page.click('[data-testid=searchResult]');
  //   await page.waitForURL('/plugins?search=video&sort=relevance&page=1');

  //   await page.goBack();
  //   await page.waitForURL(getSearchUrl());
  //   await page.waitForTimeout(500);

  //   expect(getQueryParameterValues(page, SearchQueryParams.Search)).toContain(
  //     query,
  //   );
  //   await expect(page.locator(selectors.search.result).first()).toContainText(
  //     'napari_video',
  //   );
  // });

  test('should switch to relevance sort type when searching', async ({
    page,
    viewport,
  }) => {
    await page.goto(getSearchUrl(), { timeout: 60000 });

    // eslint-disable-next-line playwright/no-conditional-in-test
    if ((viewport?.width ?? 0) >= 875) {
      await page.click(selectors.sort.sortDropdown);
      await expect(
        page.locator(selectors.sort.sortDropdown).first(),
      ).toContainText('Recently Updated');

      await searchPlugins(page, 'video');
      await page.click(selectors.sort.sortDropdown);
      await expect(
        page.locator(selectors.sort.sortDropdown).first(),
      ).toContainText('Relevance');
    } else {
      await maybeOpenAccordion(page, AccordionTitle.Sort, viewport?.width);
      await expect(page.locator(selectors.sort.selected).first()).toContainText(
        'Recently Updated',
      );

      await searchPlugins(page, 'video');
      await maybeOpenAccordion(page, AccordionTitle.Sort, viewport?.width);
      await expect(page.locator(selectors.sort.selected).first()).toHaveText(
        'Relevance',
      );
    }
  });

  test('should show result with match in name', async ({ page }) => {
    const query = 'segment';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]), {
      timeout: 60000,
    });
    await expect(
      page.locator(selectors.search.resultName).first(),
    ).toContainText(query);
  });

  test('should show result with match in summary', async ({ page }) => {
    const query = 'bio';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]), {
      timeout: 60000,
    });
    await expect(
      page.locator(selectors.search.resultSummary).first(),
    ).toContainText(query);
  });

  test('should show result with match in author name', async ({ page }) => {
    const query = 'test';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]), {
      timeout: 60000,
    });
    await expect(
      page.locator(selectors.search.resultAuthor).first(),
    ).toContainText('Test Author');
  });

  test('should show result using fuzzy matching', async ({ page }) => {
    const query = 'animate';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]), {
      timeout: 60000,
    });
    await expect(page.locator(selectors.search.resultSummary)).toContainText(
      'animation',
    );
  });
});
