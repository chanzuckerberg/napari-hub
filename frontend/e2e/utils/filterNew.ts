import { expect, Page } from '@playwright/test';

import { PluginFilter } from '../types/filter';
import { selectors } from './_selectors';
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
import { getByHasText, getByTestID, getByText, getMetadata } from './selectors';
import { AccordionTitle, maybeOpenAccordion } from './utils';

const totalPerPage = 15;

const sortOrders: Record<string, string> = {
  recentlyUpdated: 'Recently updated',
  pluginName: 'Plugin name',
  newest: 'Newest',
};

export async function filterPlugins(
  page: Page,
  pluginFilter: PluginFilter,
  sortBy = 'recentlyUpdated',
  width?: number,
) {
  // sorting order
  if (sortBy !== 'recentlyUpdated') {
    await page.locator(getByText(sortOrders[sortBy])).nth(1).click();
  }

  // on smaller screens the filter types are collapsed, so first click the accordion
  await openAccordion(page, pluginFilter.category, width);

  // select filter dropdown options
  await page.getByRole('button', { name: pluginFilter.label }).click();

  // get option values
  const filterOptions: string[] = pluginFilter.values || [];
  for (let i = 0; i < filterOptions.length; i += 1) {
    const option = filterOptions[i];
    await page
      .getByRole('option', { name: `unchecked checkbox ${option}` })
      .locator('svg')
      .click();
  }

  // close the filter dropdown
  await page.getByRole('button', { name: pluginFilter.label }).click();
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

/**
 * Opens the accordion for the chosen filter type on smaller screens
 * @param page
 * @param filterKey
 * @param width
 */
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

export async function verifyFilterResults(
  page: Page,
  pluginFilter: PluginFilter,
  expectedData: any,
  sortBy = 'recentlyUpdated',
) {
  let currentPageCounter = 1;
  const expectedTotalPages = Math.floor(expectedData.length / totalPerPage) + 1;
  // Check that filters are enabled
  const filterOptions = pluginFilter.values;
  filterOptions?.forEach(async (option) => {
    await expect(
      page.locator('.css-9iedg7').locator(getByText(option)).nth(1),
    ).toBeVisible();
  });

  for (let l = 1; l <= expectedTotalPages; l++) {
    // current page
    const pagination = page.locator(getByTestID(PAGINATION_VALUE));
    const currentPageValue = await pagination
      .locator('span')
      .nth(0)
      .textContent();
    expect(Number(currentPageValue)).toBe(currentPageCounter);

    // verify url
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    expect(page.url()).toContain(`page=${currentPageValue}`);
    expect(page.url()).toContain(`sort=${sortBy}`);
    filterOptions?.forEach(async (option) => {
      expect(page.url()).toContain(
        `${pluginFilter.name}=${option.replace(/\s+/g, '+')}`,
      );
    });

    // verify results counts
    const resultCountText =
      (await page
        .locator(getByHasText('h3', 'Browse plugins:'))
        .textContent()) || '';
    const resultCountValue = Number(resultCountText.trim().replace(/\D/g, ''));
    expect(resultCountValue).toBe(expectedData.length);

    // total pages
    const actualTotalPages = Math.floor(resultCountValue / totalPerPage) + 1;
    expect(actualTotalPages).toBe(expectedTotalPages);

    console.log('********************************');
    console.log(expectedData[0].name);
    // console.log(expectedData[1].name);
    // console.log(expectedData[2].name);
    console.log('********************************');
    // validate each plugin details on current page
    let i = 0;
    for (const plugin of await page.locator(getByTestID(SEARCH_RESULT)).all()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const data = parseItem(expectedData[i]);
      // plugin display name
      // todo: uncomment after new test id gets deployed to the environment
      // expect(
      //   await plugin.locator(getByTestID(DISPLAY_NAME)).textContent(),
      // ).toBe(fixture[i].display_name);

      // plugin name
      expect(await plugin.locator(getByTestID(RESULT_NAME)).textContent()).toBe(
        data.name,
      );
      console.log(data.name);
      // plugin summary
      expect(
        await plugin.locator(getByTestID(RESULT_SUMMARY)).textContent(),
      ).toBe(data.summary);

      // plugin authors
      const pluginAuthors = await plugin
        .locator(getByTestID(RESULT_AUTHORS))
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
      const updateDateStr: string = data.release_date.substring(0, 10);
      expect(await plugin.locator(getMetadata('h5')).nth(1).textContent()).toBe(
        'Last updated',
      );
      expect(
        await plugin.locator(getMetadata('span')).nth(1).textContent(),
      ).toBe(formateDate(updateDateStr));

      // plugin types
      const pluginTypeText: string =
        (await plugin.locator(getMetadata('span')).nth(2).textContent()) || '';
      const pluginTypes = pluginTypeText.split(',');
      const fixturePluginTypes = data.plugin_types;
      // some local test data do not have plugin types
      if (fixturePluginTypes !== undefined) {
        expect(
          await plugin.locator(getMetadata('h5')).nth(2).textContent(),
        ).toBe('Plugin type');
        pluginTypes.forEach((pluginType) => {
          expect(fixturePluginTypes).toContain(
            pluginType.trim().toLocaleLowerCase().replace('_', ' '),
          );
        });
      }

      // plugin workflow steps
      if (data.category !== undefined) {
        const fixtureWorkflowSteps = data.category['Workflow step'];
        expect(
          await plugin.locator(getMetadata('h5')).nth(2).textContent(),
        ).toBe('Plugin type');
        for (const fixtureWorkflowStep of fixtureWorkflowSteps) {
          await expect(
            plugin.getByRole('button', {
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              name: `${fixtureWorkflowStep}`,
            }),
          ).toBeVisible();
        }
      }
      // increment counter
      i++;

      // paginate
      if (currentPageCounter === 1) {
        await expect(page.locator(getByTestID(PAGINATION_LEFT))).toBeDisabled();
        if (expectedTotalPages > 1) {
          await expect(
            page.locator(getByTestID(PAGINATION_RIGHT)),
          ).toBeVisible();
        }
      }
      if (currentPageCounter === expectedTotalPages) {
        await expect(
          page.locator(getByTestID(PAGINATION_RIGHT)),
        ).toBeDisabled();
        if (expectedTotalPages > 1) {
          await expect(
            page.locator(getByTestID(PAGINATION_LEFT)),
          ).toBeVisible();
        }
      }
      if (currentPageCounter < expectedTotalPages && expectedTotalPages >= 2) {
        await page.locator(getByTestID(PAGINATION_RIGHT)).click();
      }
      currentPageCounter++;
    }
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

export function containsAllElements(sourceArr: any, targetArr: any) {
  return sourceArr.every((i) => targetArr.includes(i));
}

export function getAuthorNames(authorsObj) {
  const result: Array<string> = [];
  for (const author of authorsObj) {
    result.push(author.name);
  }
  return result;
}