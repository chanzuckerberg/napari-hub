function getFirstSearchResultName() {
  return page.$('[data-testid=searchResultName]');
}

describe('/ (Home page)', () => {
  it('should render search results for query', async () => {
    await page.goto('http://localhost:8080');
    await page.fill('[data-testid=searchBarInput]', 'video');
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render search results when opening URL with query', async () => {
    await page.goto('http://localhost:8080/?query=video');
    await expect(await getFirstSearchResultName()).toHaveText('napari_video');
  });

  it('should render original list when query is cleared', async () => {
    await page.goto('http://localhost:8080/?query=video');
    await page.fill('[data-testid=searchBarInput]', '');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });

  it('should clear query when clicking on app bar home link', async () => {
    await page.goto('http://localhost:8080/?query=video');
    await page.click('[data-testid=appBarHeader] a');
    await expect(await getFirstSearchResultName()).not.toHaveText(
      'napari_video',
    );
  });
});
