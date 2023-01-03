import { PluginFilter } from 'e2e/types/filter';
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
  return fs.readFileSync(fileName);
}

export function searchPluginFixture(pluginFilter: PluginFilter) {
  const results: any[] = [];
  const fixtures = JSON.parse(
    getFixture(pluginFixtureFile) as unknown as string,
  );
  Object.keys(pluginFilter).forEach((filterKey: string) => {
    // console.log(filterKey);
    const filterValue = pluginFilter[filterKey as keyof PluginFilter] || '';
    for (let index = 0; index < fixtures.length; ++index) {
      // plugin entry identified by the index
      const plugin = fixtures[index];

      // value of plugin data identified by filter key, e.g. "authors"
      let jsonValue = JSON.parse(plugin as string)[filterKey];
      // console.log(filterValue);

      // authors element is a array of JSON so we need to extract name attribute
      if (filterKey === 'authors') {
        const authorNames = [];
        for (let i = 0; i < jsonValue.length; ++i) {
          authorNames.push(jsonValue[i].name);
        }
        jsonValue = authorNames;
      }
      if (filterKey === 'supported_data') {
        jsonValue = plugin.category['Supported data'];
      }
      if (filterKey === 'image_modality') {
        // flatten array of arrays of image modality
        jsonValue = plugin.category_hierarchy['Image modality'].flat(1);
      }
      if (filterKey === 'python_version') {
        const versionArray: string[] = [];
        // if filter criteria is 3.6, then we want to find 3.6, 3.7, 3.8 and inclusive 3.9
        const maxVersion = 3.9;
        for (let i = 0; i < jsonValue.length; ++i) {
          let filterPythonVersion = Number(jsonValue[i]);
          while (filterPythonVersion <= maxVersion) {
            // add version to list if not already exists
            if (!versionArray.includes(jsonValue[i] as string)) {
              versionArray.push(`>=${jsonValue[i] as string}`);
            }
            filterPythonVersion += 0.1;
          }
        }
        jsonValue = versionArray;
      }
      // console.log(jsonValue);
      // if the two arrays intersect, search criteria are met
      const found = jsonValue.some((r: string) => filterValue.indexOf(r) >= 0);
      if (found) {
        results.push(fixtures[index]);
      }
    }
  });
  return results;
}
