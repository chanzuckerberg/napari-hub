import { Page } from '@playwright/test';
import { PluginData } from 'e2e/types/plugin';

import {
  PLUGIN_RESULT_NAME,
  PLUGIN_RESULT_SUMMARY,
  PLUGIN_SEARCH_RESULT,
} from './constants';
import { getByTestID } from './selectors';

export async function verifyPlugin(
  page: Page,
  resultIndex: number,
  expectedData: PluginData,
): Promise<any> {
  const plugin = page
    .locator(getByTestID(PLUGIN_SEARCH_RESULT))
    .nth(resultIndex);

  // verify H4 plugin name
  expect(plugin.locator(getByTestID(PLUGIN_RESULT_NAME))).toBe(
    expectedData.name,
  );
  // verify SPAN plugin name
  // todo: add testid to span element
  expect(
    plugin.locator(
      '#__next > div > div.flex-grow.min-h-screen > div > section > div > a:nth-child(1) > article > div > div > span',
    ),
  ).toBe(expectedData.name);

  // verify result summary
  expect(plugin.locator(getByTestID(PLUGIN_RESULT_SUMMARY))).toBe(
    expectedData.name,
  );
}
