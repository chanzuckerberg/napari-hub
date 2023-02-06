/* eslint-disable jest/no-export */

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';

import {
  getFirstSearchResultName,
  getQueryParameterValues,
  getSearchUrl,
  getSelectedSortByRadio,
  submitQuery,
} from './utils';

describe('Plugin Search', () => {
  beforeEach(async () => {
    await jestPlaywright.resetPage();
  });

  it('should update URL parameter when entering query', async () => {
    const query = 'video';
    await page.goto(getSearchUrl());
    await submitQuery(query);
    expect(getQueryParameterValues(SearchQueryParams.Search)).toContain(query);
    expect(getQueryParameterValues(SearchQueryParams.Sort)).toContain(
      SearchSortType.Relevance,
    );
  });

  it('should render search results for query', async () => {
    await page.goto(getSearchUrl());
    await submitQuery('video');
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render search results when opening URL with query', async () => {
    await page.goto(getSearchUrl([SearchQueryParams.Search, 'video']));
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render original list when query is cleared', async () => {
    await page.goto(getSearchUrl([SearchQueryParams.Search, 'video']));
    await page.click('[data-testid=clearQueryButton]');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should clear query when clicking on app bar home link', async () => {
    await page.goto(getSearchUrl([SearchQueryParams.Search, 'video']));
    await page.click('[data-testid=appBarHome]:visible');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should redirect to search page when searching from another page', async () => {
    await page.goto('http://localhost:8080/about');
    await submitQuery('video');
    await page.waitForNavigation();

    const expectedUrl = getSearchUrl(
      [SearchQueryParams.Search, 'video'],
      [SearchQueryParams.Sort, SearchSortType.Relevance],
    );
    expect(page.url()).toEqual(expectedUrl);
    await page.waitForTimeout(500);
    await expect(await getFirstSearchResultName()).toMatchText('napari_video');
  });

  it('should maintain search query when navigating back', async () => {
    const query = 'video';
    await page.goto(getSearchUrl());
    await submitQuery(query);
    await page.click('[data-testid=searchResult]');
    await page.waitForNavigation();

    await page.goBack();
    await page.waitForNavigation();
    await page.waitForTimeout(500);

    expect(getQueryParameterValues(SearchQueryParams.Search)).toContain(query);
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should switch to relevance sort type when searching', async () => {
    await page.goto(getSearchUrl());
    await expect(await getSelectedSortByRadio()).toHaveText('Recently updated');

    await submitQuery('video');
    await expect(await getSelectedSortByRadio()).toHaveText('Relevance');
  });

  it('should show result with match in name', async () => {
    const query = 'segment';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]));
    const name = await page.$('[data-testid=searchResultDisplayName]');
    await expect(name).toHaveText(query);
  });

  it('should show result with match in summary', async () => {
    const query = 'bio';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]));
    const name = await page.$('[data-testid=searchResultSummary]');
    await expect(name).toHaveText(query);
  });

  it('should show result with match in author name', async () => {
    const query = 'test';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]));
    const name = await page.$('[data-testid=searchResultAuthor]');
    await expect(name).toHaveText('Test Author');
  });

  it('should show result using fuzzy matching', async () => {
    const query = 'animate';
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]));
    const name = await page.$('[data-testid=searchResultSummary]');
    await expect(name).toHaveText('animation');
  });
});
