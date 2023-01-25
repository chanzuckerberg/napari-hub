import { expect, Page } from '@playwright/test';

import { PluginFilter } from '../types/filter';
import { selectors } from './_selectors';
import {
  DISPLAY_NAME,
  PAGINATION_LEFT,
  PAGINATION_RIGHT,
  PAGINATION_VALUE,
  RESULT_AUTHORS,
  RESULT_NAME,
  RESULT_SUMMARY,
  RESULT_WORKFLOW_STEPS,
  SEARCH_RESULT,
} from './constants';
import {
  getByClassName,
  getByHasText,
  getByTestID,
  getByText,
  getMetadata,
} from './selectors';
import { AccordionTitle, maybeOpenAccordion } from './utils';

const totalPerPage = 15;
const dateOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};
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

  await page.screenshot({ path: 'test1.png' });

  // get option values
  const filterOptions: string[] = pluginFilter.values || [];
  for (let i = 0; i < filterOptions.length; i += 1) {
    const option = filterOptions[i];
    await page
      .getByRole('option', { name: `unchecked checkbox ${option}` })
      .locator('svg')
      .click();
  }
  await page.screenshot({ path: 'test2.png' });
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
  fixture: any,
  sortBy = 'recentlyUpdated',
) {
  let currentPageCounter = 1;
  const expectedTotalPages = fixture.length / totalPerPage + 1;

  // Check that filters are enabled
  const filterOptions = pluginFilter.values;
  filterOptions?.forEach(async (option) => {
    expect(
      await page
        .getByRole('option', { name: option })
        .getAttribute('aria-selected'),
    ).toBe(true);
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
    expect(resultCountValue).toBe(fixture.length);

    // total pages
    const actualTotalPages = resultCountValue / totalPerPage + 1;
    expect(actualTotalPages).toBe(expectedTotalPages);

    // validate each plugin details on current page
    let i = 0;
    for (const plugin of await page.locator(getByTestID(SEARCH_RESULT)).all()) {
      // plugin display name
      expect(
        await plugin.locator(getByTestID(DISPLAY_NAME)).textContent(),
      ).toBe(fixture[i].display_name);

      // plugin name
      // todo: uncomment after new test id gets deployed to the environment
      expect(await plugin.locator(getByTestID(RESULT_NAME)).textContent()).toBe(
        fixture[i].name,
      );

      // plugin summary
      expect(
        await plugin.locator(getByTestID(RESULT_SUMMARY)).textContent(),
      ).toBe(fixture[i].summary);

      // plugin authors
      for (
        let j = 0;
        j < (await plugin.locator(getByTestID(RESULT_AUTHORS)).count());
        j++
      ) {
        const author = fixture[i].authors[j].name;
        expect(
          await plugin
            .locator(getByTestID(RESULT_AUTHORS))
            .nth(j)
            .textContent(),
        ).toBe(author);
      }

      // plugin version
      expect(await plugin.locator(getMetadata('h5')).nth(0).textContent()).toBe(
        'Version',
      );
      expect(
        await plugin.locator(getMetadata('span')).nth(0).textContent(),
      ).toBe(fixture[i].version);

      // plugin release date
      const dateString: string = fixture[i].release_date.substring(0, 10);
      const releaseDate = new Date(dateString).toLocaleDateString(
        'en-US',
        dateOptions,
      );
      expect(await plugin.locator(getMetadata('h5')).nth(i).textContent()).toBe(
        'Release date',
      );
      expect(
        await plugin.locator(getMetadata('span')).nth(0).textContent(),
      ).toBe(releaseDate);

      // plugin types
      const pluginTypeText: string =
        (await plugin.locator(getMetadata('span')).nth(2).textContent()) || '';
      const pluginTypes = pluginTypeText.split(',');
      const fixturePluginTypes = fixture[i].plugin_types;
      expect(await plugin.locator(getMetadata('h5')).nth(2).textContent()).toBe(
        'Plugin type',
      );
      pluginTypes.forEach((pluginType) => {
        expect(fixturePluginTypes).toContain(
          pluginType.trim().toLocaleLowerCase().replace('_', ' '),
        );
      });

      // plugin workflow steps
      const fixtureWorkflowSteps = fixture[i].category['Workflow step'];
      if (fixtureWorkflowSteps !== undefined) {
        expect(
          await plugin.locator(getMetadata('h5')).nth(2).textContent(),
        ).toBe('Plugin type');
        for (const [
          index,
          fixtureWorkflowStep,
        ] of fixtureWorkflowSteps.entries()) {
          const workflowStep = page
            .locator(getByClassName(RESULT_WORKFLOW_STEPS))
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            .nth(index)
            .textContent();
          expect(workflowStep).toBe(fixtureWorkflowStep);
        }
      }
      // increment counter
      i++;

      // paginate
      if (currentPageCounter === 1) {
        await expect(page.locator(getByTestID(PAGINATION_LEFT))).toBeHidden();
        await expect(page.locator(getByTestID(PAGINATION_RIGHT))).toBeVisible();
      }
      if (currentPageCounter === expectedTotalPages) {
        await expect(page.locator(getByTestID(PAGINATION_LEFT))).toBeVisible();
        await expect(page.locator(getByTestID(PAGINATION_RIGHT))).toBeHidden();
      }
      if (currentPageCounter < expectedTotalPages) {
        await page.locator(getByTestID(PAGINATION_RIGHT)).click();
      }
      currentPageCounter++;
    }
  }
}
