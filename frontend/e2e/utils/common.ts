import { Filter } from 'e2e/types/filter';
import fs from 'fs';

let pluginFixtureFile = `e2e/fixtures/local.json`;
const ENV = (process.env.NODE_ENV as string) || '';

if (ENV === 'staging' || ENV === 'prod') {
  pluginFixtureFile = `e2e/fixtures/${ENV}.json`;
}
/**
 * Reads JSON fixture file from the fixture directory.
 * @param fileName
 * @returns JSON object
 */
export function getFixture(fileName: string) {
  const fixture = fs.readFileSync(`fixtures/${fileName}.json`);
  return JSON.parse(fixture.toString());
}

export function searchPluginFixture(pluginFilter: Filter) {
  const results: any[] = [];
  const fixtures = getFixture(pluginFixtureFile);
  Object.keys(pluginFilter).forEach((filterKey) => {
    const filterValue = fixtures[filterKey];
    for (let index = 0; index < fixtures.length; ++index) {
      const plugin = fixtures[index];
      // most filter values are arrays except license and python version
      if (!Array.isArray(filterValue)) {
        if (
          plugin &&
          plugin[filterKey] &&
          plugin[filterKey].indexOf(filterValue) !== -1
        ) {
          results.push(plugin);
        }
      } else {
        filterValue.forEach((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          searchSinglePlugin(results, plugin, filterKey, item);
        });
      }
    }
  });
  return results;
}

function searchSinglePlugin(
  results: Array<any>,
  plugin: { [x: string]: string | string[] },
  filterKey: string,
  searchFor: string,
) {
  let fixtureValue = plugin[filterKey];
  if (filterKey === 'supported_data') {
    fixtureValue = plugin.category['Supported data'];
  }
  if (fixtureValue.includes(searchFor)) {
    results.push(plugin);
  }
  return results;
}
