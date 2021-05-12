import { SEARCH_PAGE, SEARCH_QUERY_PARAM } from '@/context/search';

function getFirstSearchResultName() {
  return page.$('[data-testid=searchResultName]');
}

function getSearchURL(query = '') {
  const url = new URL(SEARCH_PAGE, 'http://localhost:8080');

  if (query) {
    url.searchParams.set(SEARCH_QUERY_PARAM, query);
  }

  return url.toString();
}

describe('/ (Home page)', () => {
  it('should update URL parameter when entering query', async () => {
    await page.goto(getSearchURL());
    await page.fill('[data-testid=searchBarInput]', 'video');
    expect(page.url()).toEqual(getSearchURL('video'));
  });

  it('should render search results for query', async () => {
    await page.goto(getSearchURL());
    await page.fill('[data-testid=searchBarInput]', 'video');
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render search results when opening URL with query', async () => {
    await page.goto(getSearchURL('video'));
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render original list when query is cleared', async () => {
    await page.goto(getSearchURL('video'));
    await page.fill('[data-testid=searchBarInput]', '');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should clear query when clicking on app bar home link', async () => {
    await page.goto(getSearchURL('video'));
    await page.click('[data-testid=appBarHeader] a');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should redirect to search page when searching from another page', async () => {
    await page.goto('http://localhost:8080/about');
    await page.fill('[data-testid=searchBarInput]', 'video');
    await page.press('[data-testid=searchBarInput]', 'Enter');
    await page.waitForNavigation();

    expect(page.url()).toEqual(getSearchURL('video'));
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should maintain search query when navigating back', async () => {
    await page.goto(getSearchURL());
    await page.fill('[data-testid=searchBarInput]', 'video');
    await page.click('[data-testid=searchResultName]');
    await page.waitForNavigation();

    await page.goBack();
    await page.waitForNavigation();
    expect(page.url()).toEqual(getSearchURL('video'));
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });
});
