/* eslint-disable jest/no-export */

import { SearchQueryParams } from '@/store/search/constants';

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
    await page.goto(getSearchUrl([SearchQueryParams.Search, query]));
    await submitQuery(query);
    expect(getQueryParameterValues(SearchQueryParams.Search)).toContain(query);
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
    await page.click('[data-testid=appBarHome]');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should redirect to search page when searching from another page', async () => {
    await page.goto('http://localhost:8080/about');
    await submitQuery('video');
    await page.waitForNavigation();

    const expectedUrl = getSearchUrl([SearchQueryParams.Search, 'video']);
    expect(page.url()).toEqual(expectedUrl);
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should maintain search query when navigating back', async () => {
    const query = 'video';
    await page.goto(getSearchUrl());
    await submitQuery(query);
    await page.click('[data-testid=searchResult]');
    await page.waitForNavigation();

    await page.goBack();
    await page.waitForNavigation();

    expect(getQueryParameterValues(SearchQueryParams.Search)).toContain(query);
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should switch to relevance sort type when searching', async () => {
    await page.goto(getSearchUrl());
    await expect(await getSelectedSortByRadio()).toHaveText('Recently updated');

    await submitQuery('video');
    await expect(await getSelectedSortByRadio()).toHaveText('Relevance');
  });
});
