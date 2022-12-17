import { FullConfig } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(`.env`) });
/**
 * This function is run once at the start of the test
 * @param config
 */
async function globalSetup(config: FullConfig): Promise<void> {
  // set base url in as environment variable so it is accessible outside tests
  const { baseURL } = config.projects[0].use || 'http://localhost:8080';
  process.env.BASEURL = baseURL;

  if (process.env.NODE_ENV === 'development') {
    process.env.CI = 'true';
  }
}
export default globalSetup;
