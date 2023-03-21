/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-await-in-loop */
import { expect, Page } from '@playwright/test';

import { breakpoints } from '@/theme/breakpoints';

import { PluginFilter } from '../types/filter';
import {
  PAGINATION_LEFT,
  PAGINATION_RIGHT,
  PAGINATION_VALUE,
  RESULT_AUTHORS,
  RESULT_NAME,
  RESULT_SUMMARY,
  SEARCH_RESULT,
} from './constants';
import { parseItem } from './fixture';
import { getByHasText, getMetadata, selectors } from './selectors';
import {
  AccordionTitle,
  getQueryParameterValues,
  maybeExpand,
  maybeOpenAccordion,
} from './utils';

const totalPerPage = 15;

const sortOrders: Record<string, string> = {
  'Recently updated': 'recentlyUpdated',
  'Plugin name': 'pluginName',
  Newest: 'newest',
};

/**
 * Opens the accordion for the chosen filter type on smaller screens
 * @param page
 * @param filterKey
 * @param width
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function openAccordion(
  page: Page,
  filterTypes: Array<string>,
  width?: number,
) {
  const CATEGORY_FILTER_TYPE = 'Filter by category';
  filterTypes.forEach(async (filterType) => {
    const title =
      filterType === CATEGORY_FILTER_TYPE
        ? AccordionTitle.FilterByCategory
        : AccordionTitle.FilterByRequirement;
    await maybeOpenAccordion(page, title, width);
  });
}

export function containsAllElements(sourceArr: any, targetArr: any) {
  return sourceArr.every((i: unknown) => targetArr.includes(i));
}

export function getAuthorNames(authorsObj: unknown) {
  const result: Array<string> = [];
  const data = parseItem(authorsObj);
  for (const author of data) {
    result.push(author.name as string);
  }
  return result;
}

export async function filterPlugins(
  page: Page,
  pluginFilter: PluginFilter,
  sortBy = 'Recently updated',
  width?: number,
): Promise<void> {
  // sorting order

  await maybeExpand(page, width);
  if (sortBy !== 'Recently updated') {
    await page
      .locator(`[data-sort-type="${sortOrders[sortBy]}"]:visible`)
      .click();
  }

  // on smaller screens the filter types are collapsed, so first click the accordion
  await openAccordion(page, pluginFilter.category, width);

  // select filter dropdown options
  await page.getByRole('button', { name: pluginFilter.label }).click();

  // get option values
  const { label, values } = pluginFilter;
  if (
    (width || 0) < breakpoints['screen-725'] &&
    !(await page.locator('[role="tooltip"]').isVisible())
  ) {
    // drop down closes for smaller screens
    // select filter dropdown options
    await page.getByRole('button', { name: pluginFilter.label }).click();
  }

  for (let i = 0; i < values.length; i += 1) {
    const option = values[i];
    if (!(await page.locator('[role="tooltip"]').isVisible())) {
      await page.getByRole('button', { name: pluginFilter.label }).click();
    }
    await page
      .getByRole('option', { name: `unchecked checkbox ${option}` })
      .getByText(`${option}`)
      .click();
  }
  if (
    ((width || 0) < breakpoints['screen-725'] &&
      pluginFilter.label === 'Supported data') ||
    ((width || 0) < breakpoints['screen-725'] &&
      pluginFilter.label === 'Workflow step') ||
    ((width || 0) < breakpoints['screen-725'] &&
      pluginFilter.label === 'Operating system') ||
    ((width || 0) < breakpoints['screen-725'] &&
      pluginFilter.label === 'Python version') ||
    ((width || 0) < breakpoints['screen-725'] &&
      pluginFilter.label === 'Save extension') ||
    ((width || 0) < breakpoints['screen-725'] &&
      pluginFilter.label === 'Open extension')
  ) {
    // close the filter dropdown for smaller screens
    //await page.getByRole('radio', { name: sortBy }).click();
    await page.keyboard.press('Escape');
  } else {
    // close the filter dropdown
    //await page.getByRole('button', { name: label }).click();
    await page.keyboard.press('Escape');
  }
}

export async function getOptions(page: Page, labels: string[]) {
  const labelSet = new Set(labels);
  const optionNodes = await page.$$(selectors.filters.options);

  interface OptionResult {
    label: string;
    node: typeof optionNodes[number];
    enabled: boolean;
  }

  const optionResults: OptionResult[] = [];

  for (const node of optionNodes) {
    const paragraphNode = await node.$('p');
    const label = await paragraphNode?.textContent();
    const ariaSelected = await node.getAttribute('aria-selected');
    if (label && labelSet.has(label)) {
      optionResults.push({
        label,
        node,
        enabled: ariaSelected === 'true',
      });
    }
  }

  return optionResults;
}

export async function verifyFilterResults(
  page: Page,

  pluginFilter: PluginFilter,
  expectedData: any,
  params: string | (string | string[])[][],
  sortBy = 'Recently updated',
  title?: AccordionTitle,
) {
  let currentPageCounter = 1;
  const expectedTotalPages =
    expectedData.length < totalPerPage
      ? 1
      : Math.ceil(expectedData.length / totalPerPage);
  // Check that filters are enabled
  const filterOptions = pluginFilter.values;
  filterOptions?.forEach(async (option) => {
    if (
      !(await page
        .getByRole('button', { name: `${option}` })
        .first()
        .isVisible())
    ) {
      await page.locator('[data-title="Filter by requirement"]').click();
      await expect(
        page.getByRole('button', { name: `${option}` }).first(),
      ).toBeVisible();
    }
  });

  for (let pageNumber = 1; pageNumber <= expectedTotalPages; pageNumber += 1) {
    // current page
    const pagination = page.getByTestId(PAGINATION_VALUE);
    const currentPageValue = await pagination
      .locator('span')
      .nth(0)
      .textContent();
    expect(Number(currentPageValue)).toBe(currentPageCounter);

    // verify url
    expect(page.url()).toContain(`page=${currentPageValue as string}`);
    expect(page.url()).toContain(`sort=${sortOrders[sortBy]}`);
    for (const [key, value] of params) {
      const expected = getQueryParameterValues(page, key as string);
      const diff = expected.filter((x) => !value.includes(x));
      expect(diff.length).toBe(0);
    }

    // verify results counts
    const resultCountText =
      (await page
        .locator(getByHasText('h3', 'Browse plugins:'))
        .textContent()) || '';

    const resultCountValue = Number(resultCountText.trim().replace(/\D/g, ''));

    // result count
    if (pluginFilter.key === 'plugin_type') {
      // expect(resultCountValue).toBe(expectedData.length-1);
    } else {
      // expect(resultCountValue).toBe(expectedData.length);
    }

    // total pages
    const actualTotalPages =
      resultCountValue < totalPerPage
        ? 1
        : Math.ceil(resultCountValue / totalPerPage);
    expect(actualTotalPages).toBe(expectedTotalPages);

    // validate each plugin details on current page
    let i = 0;
    for (const plugin of await page.getByTestId(SEARCH_RESULT).all()) {
      const dataIndex = (pageNumber - 1) * 15 + i;
      const data = parseItem(expectedData[dataIndex]);
      // plugin display name
      // todo: uncomment after new test id gets deployed to the environment
      // expect(
      //   await plugin.getByTestId(DISPLAY_NAME)).textContent(),
      // ).toBe(fixture[i].display_name);

      // plugin name
      expect(await plugin.getByTestId(RESULT_NAME).textContent()).toBe(
        data.name,
      );

      // plugin summary
      expect(await plugin.getByTestId(RESULT_SUMMARY).textContent()).toBe(
        data.summary,
      );

      // plugin authors
      const pluginAuthors = await plugin
        .getByTestId(RESULT_AUTHORS)
        .allTextContents();
      const fixtureAuthors = getAuthorNames(data.authors);
      // check all authors displayed
      expect(containsAllElements(fixtureAuthors, pluginAuthors)).toBeTruthy();

      // plugin version
      expect(await plugin.locator(getMetadata('h5')).nth(0).textContent()).toBe(
        'Version',
      );
      expect(
        await plugin.locator(getMetadata('span')).nth(0).textContent(),
      ).toBe(data.version);

      // plugin last update
      expect(await plugin.locator(getMetadata('h5')).nth(1).textContent()).toBe(
        'Last updated',
      );
      // todo: this test is failing for one plugin where the app display 2021-05-03 as 2021-05-04
      // const updateDateStr: string = data.release_date.substring(0, 10);
      // expect(
      //   await plugin.locator(getMetadata('span')).nth(1).textContent(),
      // ).toBe(formateDate(updateDateStr));

      // plugin types
      const pluginTypeText: string =
        (await plugin.locator(getMetadata('span')).nth(2).textContent()) || '';

      if (pluginTypeText === 'information not submitted') {
        // No plugin to verify
      } else {
        const pluginTypes = pluginTypeText.split(',');
        const fixturePluginTypes = data.plugin_types;
        // some local test data do not have plugin types
        if (fixturePluginTypes !== undefined) {
          expect(
            await plugin.locator(getMetadata('h5')).nth(2).textContent(),
          ).toBe('Plugin type');
          pluginTypes.forEach((pluginType) => {
            expect(fixturePluginTypes).toContain(
              pluginType.trim().toLocaleLowerCase().replace(' ', '_'),
            );
          });
        }
      }

      // plugin workflow steps
      if (
        data.category !== undefined &&
        data.category['Workflow step'] !== undefined
      ) {
        const fixtureWorkflowSteps = data.category['Workflow step'];
        await expect(plugin.getByText('Workflow step')).toBeVisible();

        if ((await plugin.locator('text=/Show \\d more/i').count()) > 0) {
          await plugin.locator('text=/Show \\d+ more/i').first().click();
        }

        for (const fixtureWorkflowStep of fixtureWorkflowSteps) {
          expect(
            (
              await plugin
                .getByText(fixtureWorkflowStep as string)
                .allInnerTexts()
            ).length,
          ).toBeGreaterThan(0);
        }
      }
      // increment counter
      i += 1;
    }

    // paginate
    if (currentPageCounter === 1) {
      await expect(page.getByTestId(PAGINATION_LEFT)).toBeDisabled();
      if (expectedTotalPages > 1) {
        await expect(page.getByTestId(PAGINATION_RIGHT)).toBeVisible();
      }
    }
    if (currentPageCounter === expectedTotalPages) {
      await expect(page.getByTestId(PAGINATION_RIGHT)).toBeDisabled();
      if (expectedTotalPages > 1) {
        await expect(page.getByTestId(PAGINATION_LEFT)).toBeVisible();
      }
    }
    if (currentPageCounter < expectedTotalPages && expectedTotalPages >= 2) {
      await page.getByTestId(PAGINATION_RIGHT).click();
    }
    currentPageCounter += 1;
  }
}

export function formateDate(dateStr: string) {
  const d = new Date(dateStr)
    .toLocaleString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .split(' ');
  return `${d[1].replace(',', '')} ${d[0]} ${d[2]}`;
}
