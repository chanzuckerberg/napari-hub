/* eslint-disable no-await-in-loop */

import { expect, test } from '@playwright/test';

import { PluginData } from '@/types';

import {
  ACTIVITY,
  AUTHOR,
  BODY_ACTIVITY_PAGE,
  CLEAR_SEARCH,
  CONTRIBUTING,
  CONTRIBUTING_HEADER,
  HEADER_REGION,
  ISSUES,
  ISSUES_HEADER,
  LICENSE,
  LICENSE_HEADER,
  MEATADATA_PLUGIN_TYPE,
  MEATADATA_PYTHON_VERSION,
  METADATA_LICENSE,
  METADATA_OPERATING_SYSTEM,
  METADATA_REQUIREMENTS,
  METADATA_SUPPORTED_DATA,
  METADATA_VERSION,
  PLUGIN_NAME,
  PLUGIN_SUMMARY,
  PLUGIN_TYPE,
  REQUIREMENT,
  SEARCH_BUTTON,
  SEARCH_INPUT,
  SEARCH_RESULT,
  SUPPORTED_DATA,
  USAGE,
} from '../../utils/constants';
import { getFixture } from '../../utils/fixture';
import { getByID } from '../../utils/selectors';
import { getTestURL } from '../../utils/utils';

const ENV = process.env.ENV || 'local';
const query = 'napari-console';

test.describe('Plugin details tests', async () => {
  const dataByEnv = await getFixture<Record<string, PluginData>>(
    'plugin_details',
  );
  const data = dataByEnv[ENV];

  test('should verify plugin details page', async ({ page }) => {
    await page.goto(getTestURL().href);
    while (
      (await page.getByTestId(SEARCH_INPUT).getAttribute('value')) !== query
    ) {
      await page.getByTestId(SEARCH_INPUT).fill(query);
    }

    while (!(await page.getByTestId(CLEAR_SEARCH).isVisible())) {
      await page.getByTestId(SEARCH_BUTTON).click();
      await page.waitForTimeout(1000);
    }
    await page.getByTestId(SEARCH_RESULT).nth(0).click();

    // verify name
    expect(await page.locator(getByID(PLUGIN_NAME)).textContent()).toBe(
      data.name,
    );

    // verify summary
    expect(await page.locator(getByID(PLUGIN_SUMMARY)).textContent()).toBe(
      data.summary,
    );

    // verify author
    expect(await page.locator(AUTHOR).textContent()).toBe(data.authors[0].name);

    // verify the url
    expect(page.url()).toContain(data.name);

    // headers
    expect(await page.locator(getByID(CONTRIBUTING)).textContent()).toBe(
      CONTRIBUTING_HEADER,
    );
    expect(await page.locator(getByID(LICENSE)).textContent()).toBe(
      LICENSE_HEADER,
    );
    expect(await page.locator(getByID(ISSUES)).textContent()).toBe(
      ISSUES_HEADER,
    );

    // side details
    expect(
      await page.locator(getByID(METADATA_VERSION)).nth(1).textContent(),
    ).toContain(data.version);

    // TODO fix checking date, I think issue is that CI runs in different timezone than data.
    // expect(
    //   await page.locator(getByID(METADATA_RELEASE_DATE)).nth(1).textContent(),
    // ).toContain(formatDate(data.release_date.substring(0, 10) as string));

    // expect(
    //   await page.locator(getByID(METADATA_FIRST_RELEASED)).nth(1).textContent(),
    // ).toContain(formatDate(data.first_released.substring(0, 10) as string));

    expect(
      await page.locator(getByID(METADATA_LICENSE)).nth(1).textContent(),
    ).toContain(data.license);

    expect(
      await page.locator(getByID(METADATA_SUPPORTED_DATA)).nth(1).textContent(),
    ).toContain(SUPPORTED_DATA);

    expect(
      await page.locator(getByID(MEATADATA_PLUGIN_TYPE)).nth(1).textContent(),
    ).toContain(PLUGIN_TYPE);

    expect(
      await page.locator(getByID(METADATA_REQUIREMENTS)).nth(1).textContent(),
    ).toContain(REQUIREMENT);

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

    // verify activity page
    expect(await page.locator(HEADER_REGION).textContent()).toContain(ACTIVITY);

    await page.locator(HEADER_REGION).getByText(ACTIVITY).click();

    expect(
      await page.locator(BODY_ACTIVITY_PAGE).first().textContent(),
    ).toContain(USAGE);
  });
});
