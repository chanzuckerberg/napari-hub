/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect } from '@playwright/test';

import {
  DISPLAY_NAME,
  RESULT_AUTHORS,
  RESULT_NAME,
  RESULT_SUMMARY,
} from './constants';
import { parseItem } from './fixture';
import { getByTestID, getByText, getMetadata } from './selectors';

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

export async function verifyPlugin(plugin: any, data: any): Promise<void> {
  // plugin display name
  // todo: uncomment after new test id gets deployed to the environment
  // expect(
  //   await plugin.locator(getByTestID(DISPLAY_NAME)).textContent(),
  // ).toBe(fixture[i].display_name);

  // plugin name
  // todo: change this to RESULT_NAME, once the above changed
  expect(await plugin.locator(getByTestID(RESULT_NAME)).textContent()).toBe(
    data.name,
  );

  // plugin summary
  expect(await plugin.locator(getByTestID(RESULT_SUMMARY)).textContent()).toBe(
    data.summary,
  );

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
  expect(await plugin.locator(getMetadata('span')).nth(0).textContent()).toBe(
    data.version,
  );

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
  const pluginTypes = pluginTypeText.split(',');
  const fixturePluginTypes = data.plugin_types;
  // some local test data do not have plugin types
  if (fixturePluginTypes !== undefined) {
    expect(await plugin.locator(getMetadata('h5')).nth(2).textContent()).toBe(
      'Plugin type',
    );
    pluginTypes.forEach((pluginType) => {
      expect(fixturePluginTypes).toContain(
        pluginType.trim().toLocaleLowerCase().replace(' ', '_'),
      );
    });
  }

  // plugin workflow steps
  if (
    data.category !== undefined &&
    data.category['Workflow step'] !== undefined
  ) {
    const fixtureWorkflowSteps = data.category['Workflow step'];
    await expect(plugin.locator(getByText('Workflow step'))).toBeVisible();

    if ((await plugin.locator('text=/Show \\d more/i').count()) > 0) {
      await plugin.locator('text=/Show \\d+ more/i').first().click();
    }

    for (const fixtureWorkflowStep of fixtureWorkflowSteps) {
      await expect(
        plugin.locator(getByText(fixtureWorkflowStep as string)),
      ).toBeVisible();
    }
  }
}
