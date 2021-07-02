// TODO Add more meaningful tests when E2E implementation of plugin page is ready.
describe('/plugin (Plugin Page)', () => {
  beforeAll(async () => {
    await page.goto(
      'http://localhost:8080/plugins/napari-compressed-labels-io',
    );
  });

  it('should render details', async () => {
    await expect(page).toHaveSelector('[data-testid=pluginDetails]');
  });

  it('should render title', async () => {
    await expect(page).toHaveText(
      '[data-testid=pluginDetails] h1',
      'napari-compressed-labels-io',
    );
  });
});
