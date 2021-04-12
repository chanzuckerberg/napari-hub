describe('/ (Home page)', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:8080');
  });

  it('should render hello world', async () => {
    await expect(page).toHaveText(
      '[data-napari-test=homeText]',
      'Hello, World!',
    );
  });
});
