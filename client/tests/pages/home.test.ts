import { SEARCH_PAGE, SearchQueryParams } from '@/context/search';
import { Page } from 'playwright';

function getFirstSearchResultName() {
  return page.$('[data-testid=searchResultName]');
}

function getSearchURL(query = '') {
  const url = new URL(SEARCH_PAGE, 'http://localhost:8080');

  if (query) {
    url.searchParams.set(SearchQueryParams.Search, query);
  }

  return url.toString();
}

function hasSearchParam(page: Page, query: string) {
  const param = `${SearchQueryParams.Search}=${query}`;
  return page.url().includes(param);
}

async function submitQuery(query: string) {
  await page.fill('[data-testid=searchBarInput]', query);
  await page.press('[data-testid=searchBarInput]', 'Enter');
}

describe('/ (Home page)', () => {
  it('should update URL parameter when entering query', async () => {
    const query = 'video';
    await page.goto(getSearchURL());
    await submitQuery(query);
    expect(hasSearchParam(page, query)).toBe(true);
  });

  it('should render search results for query', async () => {
    await page.goto(getSearchURL());
    await submitQuery('video');
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render search results when opening URL with query', async () => {
    await page.goto(getSearchURL('video'));
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render original list when query is cleared', async () => {
    await page.goto(getSearchURL('video'));
    await page.click('[data-testid=clearQueryButton]');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should clear query when clicking on app bar home link', async () => {
    await page.goto(getSearchURL('video'));
    await page.click('[data-testid=appBarHome]');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should redirect to search page when searching from another page', async () => {
    await page.goto('http://localhost:8080/about');
    await submitQuery('video');
    await page.waitForNavigation();

    expect(page.url()).toEqual(getSearchURL('video'));
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it.only('should maintain search query when navigating back', async () => {
    const query = 'video';
    await page.goto(getSearchURL());
    await submitQuery(query);
    await page.click('[data-testid=searchResult]');
    await page.waitForNavigation();

    await page.goBack();
    expect(hasSearchParam(page, query)).toBe(true);
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });
});
