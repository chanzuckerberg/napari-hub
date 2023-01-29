import fs from 'fs';
import _ from 'lodash';

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
  const rawData = fs.readFileSync(file);
  return JSON.parse(rawData as unknown as string);
}

export function searchPluginFixture(
  pluginFilter: PluginFilter,
  sortBy: string,
) {
  const fixtures = getFixture();
  const { key, values } = pluginFilter;
  let filtered;
  if (key === 'authors') {
    filtered = _.filter(fixtures, (item) => {
      const result = _.intersectionBy(
        _.map(JSON.parse(item as string).authors, (author) => author.name),
        values,
      );
      return result.length !== 0;
    });
  }
  if (key === 'supported_data') {
    // searchResults.push(
    //   // eslint-disable-next-line func-names
    //   _.filter(fixtures, function (item) {
    //     return _.includes(values, item.category['Supported data']);
    //   }),
    // );
    // searchResults.push(
    //   fixtures.filter((plugin: { category: { [x: string]: any[] } }) =>
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    //     plugin.category['Supported data'].filter((x) => values.includes(x)),
    //   ),
    // );
  }
  // if (pluginFilter.key === 'image_modality') {
  //   // flatten array of arrays of image modality
  //   fixtureValues = plugin.category_hierarchy['Image modality'].flat(1);
  // }
  // if (pluginFilter.key === 'python_version') {
  //   const versionArray: string[] = [];
  //   // if filter criteria is 3.6, then we want to find 3.6, 3.7, 3.8 and inclusive 3.9
  //   const maxVersion = 3.9;
  //   for (let i = 0; i < jsonValue.length; ++i) {
  //     let filterPythonVersion = Number(jsonValue[i]);
  //     while (filterPythonVersion <= maxVersion) {
  //       // add version to list if not already exists
  //       if (!versionArray.includes(jsonValue[i] as string)) {
  //         versionArray.push(`>=${jsonValue[i] as string}`);
  //       }
  //       filterPythonVersion += 0.1;
  //     }
  //   }
  //   fixtureValues = versionArray;
  // }
  // console.log(jsonValue);
  // if the two arrays intersect, search criteria are met
  // if (fixtureValues !== undefined) {
  //   const found = fixtureValues.some(
  //     (r: string) => filterValue.indexOf(r) >= 0,
  //   );
  //   if (found) {
  //     results.push(plugin);
  //   }
  // }
  //}
  // });

  // sort results
  let sortedPlugins;
  if (sortBy === 'recentlyUpdated') {
    sortedPlugins = _.orderBy(
      filtered,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      [(plugin) => new Date(plugin.release_date)],
      ['desc'],
    );
  } else if (sortBy === 'newest') {
    sortedPlugins = _.orderBy(
      filtered,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      [(plugin) => new Date(plugin.first_released)],
      ['desc'],
    );
  } else {
    sortedPlugins = _.orderBy(filtered, [(plugin) => plugin.name], ['asc']);
  }
  return sortedPlugins;
}
