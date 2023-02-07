import { test, expect } from '@playwright/test';
import { getFixture } from '../utils/fixture';

import {
  AUTHORS,
  SEARCH_INPUT,
  SEARCH_BUTTON,
  CLEAR_SEARCH,
  SEARCH_RESULT,
  PLUGIN_NAME,
  PLUGIN_SUMMARY,
  LICENSE,
  CONTRIBUTING,
  ISSUES,
  METADATA_VERSION,
  METADATA_RELEASE_DATE,
  METADATA_FIRST_RELEASED,
  METADATA_LICENSE,
  METADATA_SUPPORTED_DATA,
  MEATADATA_PLUGIN_TYPE,
  MEATADATA_PYTHON_VERSION,
  METADATA_OPERATING_SYSTEM,
  METADATA_REQUIREMENTS,
} from '../utils/constants';
import { getByID, getByTestID } from '../utils/selectors';
import { formateDate } from '../utils/filterNew';

const ENV = (process.env.NODE_ENV as string) || '';

test.describe('Plugin deatils tests', () => {
  test.only('should verify details page', async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
    const query = 'napari-console';
    const data = getFixture(`e2e/fixtures/test.json`);

    while (
      (await page.locator(getByTestID(SEARCH_INPUT)).getAttribute('value')) !=
      query
    ) {
      await page.locator(getByTestID(SEARCH_INPUT)).fill(query);
    }

    while (!(await page.locator(getByTestID(CLEAR_SEARCH)).isVisible())) {
      page.locator(getByTestID(SEARCH_BUTTON)).click();
      await page.waitForTimeout(1000);
    }
    await page.locator(getByTestID(SEARCH_RESULT)).nth(0).click();

    //verfiy name
    expect(await page.locator(getByID(PLUGIN_NAME)).textContent()).toBe(
      data.name,
    );

    //verify summary
    expect(await page.locator(getByID(PLUGIN_SUMMARY)).textContent()).toBe(
      data.summary,
    );

    //installation button
    expect(
      page
        .getByRole('heading', { name: 'Installation ¶' })
        .getByText('Installation'),
    ).toBeVisible();

    //headers
    expect(page.locator(getByID(CONTRIBUTING))).toBeVisible();
    expect(page.locator(getByID(LICENSE))).toBeVisible();
    expect(page.locator(getByID(ISSUES))).toBeVisible();

    //side details
    expect(
      await page.locator(getByID(METADATA_VERSION)).nth(1).textContent(),
    ).toContain(data.version);
    expect(
      await page.locator(getByID(METADATA_RELEASE_DATE)).nth(1).textContent(),
    ).toContain(formateDate(data.release_date.substring(0, 10)));
    expect(
      await page.locator(getByID(METADATA_FIRST_RELEASED)).nth(1).textContent(),
    ).toContain(formateDate(data.first_released.substring(0, 10)));
    expect(
      await page.locator(getByID(METADATA_LICENSE)).nth(1).textContent(),
    ).toContain(data.license);
    expect(
      await page.locator(getByID(METADATA_SUPPORTED_DATA)).nth(1),
    ).toBeVisible();
    expect(
      await page.locator(getByID(MEATADATA_PLUGIN_TYPE)).nth(1),
    ).toBeVisible();
    expect(
      await page
        .locator(getByID(MEATADATA_PYTHON_VERSION))
        .nth(1)
        .textContent(),
    ).toContain(data.python_version);
    data.operating_system.map(async (system: string) => {
      const system_type = await page
        .locator(getByID(METADATA_OPERATING_SYSTEM))
        .nth(1)
        .textContent();
      expect(system_type?.toLowerCase()).toContain(system);
    });
    expect(page.locator(getByID(METADATA_REQUIREMENTS)).nth(1)).toBeVisible();
  });
});
