import fs from 'fs';

import { PluginFilter } from '../types/filter';

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
export function getFixture(fileName?: string) {
  const file = fileName !== undefined ? fileName : pluginFixtureFile;
  return fs.readFileSync(file);
}

export function searchPluginFixture(pluginFilter: PluginFilter) {
  const results: any[] = [];
  const fixtures = JSON.parse(
    getFixture(pluginFixtureFile) as unknown as string,
  );
  //console.log(fixtures);
  const filterValue = pluginFilter.values || '';
  for (const plugin in fixtures) {
    // plugin entry identified by the index
    // const plugin = fixtures[index];
    //console.log(plugin);
    // value of plugin data identified by filter key, e.g. "authors"
    let jsonValue = JSON.parse(plugin as string)[pluginFilter.key];
    //console.log(pluginFilter.key);

    if (pluginFilter.key === 'authors') {
      // authors element is a array of JSON so we need to extract name attribute
      const authorNames: string[] = [];
      for (let i = 0; i < jsonValue.length; ++i) {
        const author = JSON.parse(jsonValue[i] as string);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        authorNames.push(author.name);
      }
      jsonValue = authorNames;
    }
    if (pluginFilter.key === 'supported_data') {
      jsonValue = plugin.category;
      console.log(jsonValue);
    }
    if (pluginFilter.key === 'image_modality') {
      // flatten array of arrays of image modality
      jsonValue = plugin.category_hierarchy['Image modality'].flat(1);
    }
    if (pluginFilter.key === 'python_version') {
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
  // });
  return results;
}

export async function sortFixture(data: any, sortBy: string) {
  // eslint-disable-next-line array-callback-return, consistent-return
  const sortedData = data.sort((a, b) => {
    let leftValue = a.display_name;
    let rightValue = b.display_name;
    if (sortBy !== 'display_name') {
      leftValue = new Date(a[sortBy] as string);
      rightValue = new Date(b[sortBy] as string);
    }
    if (leftValue < rightValue) {
      return -1;
    }
  });
  return sortedData;
}
