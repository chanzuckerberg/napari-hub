describe('/ (Home page)', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:8080');
  });

  it('should render hello world', async () => {
    await expect(page).toHaveText('[data-testid=homeText]', 'Hello, World!');
  });
});
