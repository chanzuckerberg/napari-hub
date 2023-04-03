import { expect, test } from '@playwright/test';

import { selectors } from '../../utils/selectors';
import { getTestURL } from '../../utils/utils';

test.describe('/plugin (Plugin Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(getTestURL('/plugins/napari-compressed-labels-io'), {
      timeout: 60000,
    });
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
