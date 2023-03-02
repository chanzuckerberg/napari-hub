import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { ApiGetRequest } from '../utils/api';
import { API } from '../utils/constants';

dotenv.config({ path: path.resolve(`.env`) });
/**
 * This function is run once at the start of the test
 * @param config
 */

async function globalSetup(config: FullConfig): Promise<void> {
  // set base url in as environment variable so it is accessible outside tests
  const { baseURL } = config.projects[0].use || 'http://localhost:8080';
  process.env.BASEURL = baseURL;
  const ENV = (process.env.NODE_ENV as string) || '';

  if (ENV === 'ci') {
    process.env.CI = 'true';
  }

  // for staging & prd we need to create test data
  if (ENV === 'staging' || ENV === 'prod') {
    const pluginDataFile = `e2e/fixtures/${ENV}.json`;
    const api = API[ENV.toUpperCase()];

    // get list of plugins
    const plugins: string[] = (await ApiGetRequest(
      api,
      '/plugins',
    )) as string[];

    // 1. for each plugin received, call api to get the data
    // 2. save plugin JSON to files
    // 3. merge all JSON files into one
    // 4. save to a fixture
    const dataArray: string[] = [];
    let counter = 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/await-thenable
    Object.keys(plugins).forEach(async (pluginName: string) => {
      const pluginJson = JSON.stringify(
        await ApiGetRequest(api, `/plugins/${pluginName}`),
      );
      dataArray.push(pluginJson);
      counter += 1;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (counter === Object.keys(plugins).length) {
        fs.writeFileSync(pluginDataFile, JSON.stringify(dataArray));
      }
    });
  }
}
// eslint-disable-next-line import/no-default-export
export default globalSetup;
