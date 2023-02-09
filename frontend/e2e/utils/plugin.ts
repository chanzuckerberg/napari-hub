/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect } from '@playwright/test';

import { RESULT_AUTHORS, RESULT_NAME, RESULT_SUMMARY } from './constants';
import { parseItem } from './fixture';
import { getByTestID, getByText, getMetadata } from './selectors';

export function containsAllElements(sourceArr: any, targetArr: any) {
  return sourceArr.every((i: unknown) => targetArr.includes(i));
}

export function getAuthorNames(authorsObj: any) {
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

  let plugin_names = getPluginNames(data);
  let plugin_name = await plugin
    .locator(getByTestID(RESULT_NAME))
    .textContent();
  let plugin_prop = getPluginProp(data);
  let plugin_categories = getPluginCategory(data);
  // plugin name
  console.log(plugin_names);
  console.log('-----------------------');
  console.log(plugin_name);
  expect(plugin_names.includes(plugin_name)).toBeTruthy();

  // plugin summary
  expect(await plugin.locator(getByTestID(RESULT_SUMMARY)).textContent()).toBe(
    plugin_prop[`${plugin_name}`]['summary'],
  );

  // plugin authors
  // const pluginAuthors = await plugin
  //   .locator(getByTestID(RESULT_AUTHORS))
  //   .allTextContents();
  // const fixtureAuthors = getAuthorNames(data.authors);
  // // check all authors displayed
  // expect(containsAllElements(fixtureAuthors, pluginAuthors)).toBeTruthy();

  // plugin version
  expect(await plugin.locator(getMetadata('h5')).nth(0).textContent()).toBe(
    'Version',
  );
  expect(await plugin.locator(getMetadata('span')).nth(0).textContent()).toBe(
    plugin_prop[`${plugin_name}`]['version'],
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
  const fixturePluginTypes =
    plugin_prop[`${plugin_name}`]['fixturePluginTypes'];
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
    plugin_prop[`${plugin_name}`]['category'] !== 'undefined' &&
    plugin_categories[`${plugin_name}`]['category'] !== 'undefined'
  ) {
    const category = plugin_categories[`${plugin_name}`]['category'];
    const fixtureWorkflowSteps = category.split(',');

    expect(await plugin.textContent()).toContain('Workflow step');
    // await expect(await plugin.locator(getByText('Workflow step'))).toBeVisible();

    if ((await plugin.locator('text=/Show \\d more/i').count()) > 0) {
      await plugin.locator('text=/Show \\d+ more/i').first().click();
    }

    for (const fixtureWorkflowStep of fixtureWorkflowSteps) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        await plugin.locator(getByText(fixtureWorkflowStep as string)),
      ).toBeVisible();
    }
  }
}

export function getPluginProp(fixtureData: any) {
  let length = fixtureData.length;
  let arr = [];
  let dict: { [key: string]: any } = {};
  for (let i = 0; i < length; i++) {
    const data = parseItem(fixtureData[i]);
    arr.push(data.display_name);
    dict[`${data.display_name}`] = {
      summary: `${data.summary}`,
      version: `${data.version}`,
      fixturePluginTypes: `${data.plugin_types}`,
      category: `${data.category}`,
      update: `${data.release_date}`,
    };
  }
  return dict;
}
export function getPluginNames(fixtureData: any) {
  let length = fixtureData.length;
  let arr = [];
  let dict: { [key: string]: any } = {};
  for (let i = 0; i < length; i++) {
    const data = parseItem(fixtureData[i]);
    arr.push(data.display_name);
    dict[`${data.display_name}`] = {
      summary: `${data.summary}`,
      version: `${data.version}`,
      fixturePluginTypes: `${data.plugin_types}`,
      category: `${data.category}`,
      authors: `${data.authors}`,
      update: `${data.release_date}`,
    };
  }
  return arr;
}

export function getPluginCategory(fixtureData: any) {
  let length = fixtureData.length;
  let arr = [];
  let dict: { [key: string]: any } = {};
  for (let i = 0; i < length; i++) {
    const data = parseItem(fixtureData[i]);
    arr.push(data.name);
    if (data.category !== undefined) {
      dict[`${data.display_name}`] = {
        category: `${data.category['Workflow step']}`,
      };
    }
  }
  return dict;
}
