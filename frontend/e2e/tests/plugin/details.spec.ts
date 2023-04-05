/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect, test } from '@playwright/test';

import { formateDate } from '../../utils/plugin';
import { getFixture } from '../../utils/fixture';
import { getByID } from '../../utils/selectors';
import {
  ACTIVITY,
  AUTHOR,
  BUTTON,
  CLEAR_SEARCH,
  CONTRIBUTING,
  CONTRIBUTING_HEADER,
  HEADER_REGION,
  INSTALL,
  ISSUES,
  ISSUES_HEADER,
  LICENSE,
  LICENSE_HEADER,
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
  PLUGIN_TYPE,
  REQUIREMENT,
  SEARCH_BUTTON,
  SEARCH_INPUT,
  SEARCH_RESULT,
  SIDE_BAR,
  SUPPORTED_DATA,
  USAGE,
  BODY_ACTIVITY_PAGE,
} from '../../utils/constants';
const ENV = (process.env.NODE_ENV as string) || '';
const data = getFixture(`e2e/fixtures/plugin_details.json`)[ENV];
const query = 'napari-console';

test.describe('Plugin details tests', () => {
  test.only('should verify plugin details page', async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
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

    // installation button
    expect(await page.locator(SIDE_BAR).getByTestId(BUTTON).textContent()).toBe(
      INSTALL,
    );

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

    expect(
      await page.locator(getByID(METADATA_RELEASE_DATE)).nth(1).textContent(),
    ).toContain(formateDate(data.release_date.substring(0, 10) as string));

    expect(
      await page.locator(getByID(METADATA_FIRST_RELEASED)).nth(1).textContent(),
    ).toContain(formateDate(data.first_released.substring(0, 10) as string));

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
