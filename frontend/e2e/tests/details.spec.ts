import { expect, test } from '@playwright/test';

import {
  CLEAR_SEARCH,
  CONTRIBUTING,
  ISSUES,
  LICENSE,
  MEATADATA_PLUGIN_TYPE,
  MEATADATA_PYTHON_VERSION,
  METADATA_FIRST_RELEASED,
  METADATA_LICENSE,
  METADATA_OPERATING_SYSTEM,
  METADATA_RELEASE_DATE,
  METADATA_REQUIREMENTS,
  METADATA_SUPPORTED_DATA,
  METADATA_VERSION,
  PLUGIN_NAME,
  PLUGIN_SUMMARY,
  SEARCH_BUTTON,
  SEARCH_INPUT,
  SEARCH_RESULT,
} from '../utils/constants';
import { formateDate } from '../utils/filterNew';
import { getFixture } from '../utils/fixture';
import { getByID, getByTestID } from '../utils/selectors';

test.describe('Plugin deatils tests', () => {
  test.only('should verify details page', async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
    const query = 'napari-console';
    const data = getFixture(`e2e/fixtures/test.json`);

    while (
      (await page.locator(getByTestID(SEARCH_INPUT)).getAttribute('value')) !==
      query
    ) {
      await page.locator(getByTestID(SEARCH_INPUT)).fill(query);
    }

    while (!(await page.locator(getByTestID(CLEAR_SEARCH)).isVisible())) {
      await page.locator(getByTestID(SEARCH_BUTTON)).click();
      await page.waitForTimeout(1000);
    }
    await page.locator(getByTestID(SEARCH_RESULT)).nth(0).click();

    // verify name
    expect(await page.locator(getByID(PLUGIN_NAME)).textContent()).toBe(
      data.name,
    );

    // verify summary
    expect(await page.locator(getByID(PLUGIN_SUMMARY)).textContent()).toBe(
      data.summary,
    );

    // installation button
    await expect(
      page
        .getByRole('heading', { name: 'Installation ¶' })
        .getByText('Installation'),
    ).toBeVisible();

    // headers
    await expect(page.locator(getByID(CONTRIBUTING))).toBeVisible();
    await expect(page.locator(getByID(LICENSE))).toBeVisible();
    await expect(page.locator(getByID(ISSUES))).toBeVisible();

    // side details
    expect(
      await page.locator(getByID(METADATA_VERSION)).nth(1).textContent(),
    ).toContain(data.version);
    expect(
      await page.locator(getByID(METADATA_RELEASE_DATE)).nth(1).textContent(),
    ).toContain(formateDate(data.release_date.substring(0, 10) as string));
    expect(
      await page.locator(getByID(METADATA_FIRST_RELEASED)).nth(1).textContent(),
    ).toContain(formateDate(data.first_released.substring(0, 10) as string));
    expect(
      await page.locator(getByID(METADATA_LICENSE)).nth(1).textContent(),
    ).toContain(data.license);
    await expect(
      page.locator(getByID(METADATA_SUPPORTED_DATA)).nth(1),
    ).toBeVisible();
    await expect(
      page.locator(getByID(MEATADATA_PLUGIN_TYPE)).nth(1),
    ).toBeVisible();
    expect(
      await page
        .locator(getByID(MEATADATA_PYTHON_VERSION))
        .nth(1)
        .textContent(),
    ).toContain(data.python_version);
    data.operating_system.map(async (system: string) => {
      const systemType = await page
        .locator(getByID(METADATA_OPERATING_SYSTEM))
        .nth(1)
        .textContent();
      expect(systemType?.toLowerCase()).toContain(system);
    });
    await expect(
      page.locator(getByID(METADATA_REQUIREMENTS)).nth(1),
    ).toBeVisible();
  });
});
