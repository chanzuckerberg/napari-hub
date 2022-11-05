import { expect, test } from '@playwright/test';

import { selectors } from '@/tests/selectors';
import { getTestURL } from '@/tests/utils';

test.describe('/plugin (Plugin Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(getTestURL('/plugins/napari-compressed-labels-io'));
  });

  test('should render details', async ({ page }) => {
    await expect(page.locator(selectors.plugin.details)).toBeVisible();
  });

  test('should render title', async ({ page }) => {
    await expect(page.locator(selectors.plugin.title)).toContainText(
      'napari-compressed-labels-io',
    );
  });
});
