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
});
