import { test } from '@playwright/test';

import { AUTHORS } from '../../utils/constants';
import { testPlugin } from '../../utils/plugin';

const ENV = (process.env.NODE_ENV as string) || '';
const TEST_AUTHORS = AUTHORS[ENV.toUpperCase()];

test.describe('Plugin sorting tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`, { timeout: 60000 });
  });
  test(`should sort plugins by name`, async ({ page, viewport }) => {
    const authors = TEST_AUTHORS[0];
    // sort by
    const sortBy = 'Plugin name';

    // filter by
    const filterBy = {
      label: 'Authors',
      name: 'authors',
      values: authors,
      category: ['Filter by category'],
      key: 'authors',
    };
    const params = [['authors', authors]];
    await testPlugin(page, filterBy, params, sortBy, viewport?.width);
  });
  test(`should sort plugins by recently updated`, async ({
    page,
    viewport,
  }) => {
    const authors = TEST_AUTHORS[0];
    // sort by
    const sortBy = 'Recently updated';

    // filter by
    const filterBy = {
      label: 'Authors',
      name: 'authors',
      values: authors,
      category: ['Filter by category'],
      key: 'authors',
    };
    const params = [['authors', authors]];
    await testPlugin(page, filterBy, params, sortBy, viewport?.width);
  });
  test(`should sort plugins by newest`, async ({ page, viewport }) => {
    const authors = TEST_AUTHORS[0];
    // sort by
    const sortBy = 'Newest';

    // filter by
    const filterBy = {
      label: 'Authors',
      name: 'authors',
      values: authors,
      category: ['Filter by category'],
      key: 'authors',
    };
    const params = [['authors', authors]];
    await testPlugin(page, filterBy, params, sortBy, viewport?.width);
  });
});
