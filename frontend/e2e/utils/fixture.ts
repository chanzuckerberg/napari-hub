import fs from 'fs-extra';
import path from 'path';

const ENV = process.env.ENV || 'local';

/**
 * Reads JSON fixture file from the fixture directory.
 * @param name
 * @returns JSON object
 */
export async function getFixture<T>(name?: string) {
  const file = `${name ?? ENV}.json`;
  const rawData = await fs.readFile(
    path.resolve(__dirname, `../fixtures`, file),
    'utf-8',
  );

  return JSON.parse(rawData) as T;
}
