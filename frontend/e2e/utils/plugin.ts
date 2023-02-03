import { expect, Page } from '@playwright/test';

import { PluginData } from '../types/plugin';
import {
  RESULT_AUTHORS,
  RESULT_NAME,
  RESULT_RELEASE_DATE,
  RESULT_SUMMARY,
  RESULT_TYPE,
  RESULT_VERSION,
  RESULT_WORKFLOW_STEPS,
  SEARCH_RESULT,
} from './constants';
import { getByDataLabel, getByTestID } from './selectors';

export async function verifyPlugin(
  page: Page,
  resultIndex: number,
  expectedData: PluginData,
): Promise<any> {
  const plugin = page.locator(getByTestID(SEARCH_RESULT)).nth(resultIndex);

  // verify H4 plugin name
  expect(plugin.locator(getByTestID(RESULT_NAME))).toBe(expectedData.name);
  // verify SPAN plugin name
  // todo: add testid to span element
  expect(
    plugin.locator(
      '#__next > div > div.flex-grow.min-h-screen > div > section > div > a:nth-child(1) > article > div > div > span',
    ),
  ).toBe(expectedData.name);

  // verify result summary
  expect(plugin.locator(getByTestID(RESULT_SUMMARY))).toBe(
    expectedData.summary,
  );

  // verify authors
  expect(plugin.locator(getByTestID(RESULT_AUTHORS))).toBe(
    expectedData.authors,
  );

  // verify version
  expect(plugin.locator(getByDataLabel(RESULT_VERSION))).toBe(
    expectedData.version,
  );

  // verify release date
  expect(plugin.locator(getByDataLabel(RESULT_RELEASE_DATE))).toBe(
    expectedData.release_date,
  );
  // verify plugin type
  if (expectedData.type !== undefined) {
    expect(plugin.locator(getByDataLabel(RESULT_TYPE))).toBe(expectedData.type);
  } else {
    expect(plugin.locator(getByDataLabel(RESULT_TYPE))).toBeUndefined();
  }

  // verify plugin type
  if (expectedData.workflow_steps !== undefined) {
    // get all workflow steps in an array
    const pluginWorkflowSteps: any[] = [];
    expect(pluginWorkflowSteps).toBe(expectedData.type);
  } else {
    expect(
      plugin.locator(getByDataLabel(RESULT_WORKFLOW_STEPS)),
    ).toBeUndefined();
  }
}
