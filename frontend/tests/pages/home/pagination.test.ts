import { snapshot } from 'valtio';

import pluginIndex from '@/fixtures/index.json';
import { SearchQueryParams, SearchSortType } from '@/store/search/constants';
import {
  initSearchEngine,
  resetState,
  searchFormStore,
} from '@/store/search/form.store';
import { searchResultsStore } from '@/store/search/results.store';

import { getSearchResultNames, getSearchUrl } from './utils';

function hasPageQueryParameter(pageValue: number) {
  const url = new URL(page.url());
  return +(url.searchParams.get(SearchQueryParams.Page) ?? 0) === pageValue;
}

async function timeout(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function initTestSearchEngine() {
  // Initialize serach engine
  initSearchEngine(pluginIndex);

  while (snapshot(searchResultsStore).results.totalPlugins === 0) {
    // eslint-disable-next-line no-await-in-loop
    await timeout(100);
  }
}

async function getResultNames() {
  const nameNodes = await getSearchResultNames();
  const names = await Promise.all(nameNodes.map((node) => node.textContent()));
  return names;
}

async function testResults() {
  const names = await getResultNames();
  const state = snapshot(searchFormStore);
  const { results } = snapshot(searchResultsStore);

  await expect(
    await page.$('[data-testid=paginationValue] span:nth-child(1)'),
  ).toHaveText(String(state.page));
  await expect(
    await page.$('[data-testid=paginationValue] span:nth-child(3)'),
  ).toHaveText(String(results.totalPages));

  expect(names).toHaveLength(results.paginatedResults.length);
  expect(names).toEqual(
    results.paginatedResults.map(({ plugin }) => plugin.name),
  );
}

describe('Plugin Pagination', () => {
  beforeEach(async () => {
    await jestPlaywright.resetPage();
    resetState();
    searchFormStore.page = 1;
  });

  // eslint-disable-next-line jest/expect-expect
  it('should render full results in pages', async () => {
    await page.goto(getSearchUrl());
    await initTestSearchEngine();
    await testResults();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should render filtered results in pages', async () => {
    const query = 'video';
    await page.goto(
      getSearchUrl(
        [SearchQueryParams.Search, query],
        [SearchQueryParams.Sort, SearchSortType.Relevance],
      ),
    );

    searchFormStore.search.query = query;
    searchFormStore.sort = SearchSortType.Relevance;
    await initTestSearchEngine();
    await testResults();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should update results when navigating pages', async () => {
    await page.goto(getSearchUrl());
    searchFormStore.page = 2;
    await initTestSearchEngine();

    await page.click('[data-testid=paginationRight]');
    await testResults();
    expect(hasPageQueryParameter(2)).toBe(true);

    searchFormStore.page = 3;
    await page.click('[data-testid=paginationRight]');
    await testResults();
    expect(hasPageQueryParameter(3)).toBe(true);

    searchFormStore.page = 1;
    await page.click('[data-testid=paginationLeft]');
    await page.click('[data-testid=paginationLeft]');
    await testResults();
    expect(hasPageQueryParameter(1)).toBe(true);
  });
});
