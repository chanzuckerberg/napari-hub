import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(`.env`) });
/**
 * This function is run once at the start of the test
 * @param config
 */

function globalSetup(config: FullConfig): void {
  // set base url in as environment variable so it is accessible outside tests
  const { baseURL } = config.projects[0].use || 'http://localhost:8080';
  process.env.BASEURL = baseURL;

  if (process.env.NODE_ENV === 'development') {
    process.env.CI = 'true';
  }
}

// eslint-disable-next-line import/no-default-export
export default globalSetup;
