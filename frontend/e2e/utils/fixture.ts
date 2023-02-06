import fs from 'fs';
import { filter, intersectionBy, map, orderBy } from 'lodash';

import { PluginFilter } from '../types/filter';

let pluginFixtureFile = `e2e/fixtures/local.json`;
const ENV = (process.env.NODE_ENV as string) || '';
const OPERATING_SYSTEMS: Record<string, string> = {
  macOS: 'Operating System :: macOS',
  Windows: 'Operating System :: Microsoft :: Windows :: Windows 10',
  Linux: 'Operating System :: POSIX :: Linux',
};

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

// fixture for local environment is already parsed; parsing again causes issues
export function parseItem(text: any) {
  if (typeof text === 'object') {
    return text;
  }
  return JSON.parse(text as string);
}

export function searchPluginFixture(
  pluginFilter: PluginFilter,
  sortBy: string,
) {
  const fixtures = getFixture();
  const { key, values } = pluginFilter;

  let filtered;
  if (key === 'authors') {
    filtered = filter(fixtures, (item) => {
      const result = intersectionBy(
        map(parseItem(item as string).authors, (author) => author.name),
        values,
      );
      return result.length !== 0;
    });
  }
  if (key === 'supported_data') {
    filtered = filter(fixtures, (item) => {
      if (!parseItem(item).category) {
        return false;
      }
      const result = intersectionBy(
        map(
          parseItem(item as string).category['Supported data'],
          (data) => data,
        ),
        values,
      );
      return result.length !== 0;
    });
  }
  if (key === 'image_modality') {
    filtered = filter(fixtures, (item) => {
      if (!parseItem(item).category) {
        return false;
      }
      const result = intersectionBy(
        map(
          parseItem(item as string).category['Image modality'],
          (data) => data,
        ),
        values,
      );
      return result.length !== 0;
    });
  }
  if (key === 'workflow_step') {
    filtered = filter(fixtures, (item) => {
      if (!parseItem(item).category) {
        return false;
      }
      const result = intersectionBy(
        map(
          parseItem(item as string).category['Workflow step'],
          (data) => data,
        ),
        values,
      );
      return result.length !== 0;
    });
  }
  if (key === 'python_version') {
    filtered = filter(fixtures, (item) => {
      const result = intersectionBy(
        map(
          parseItem(item as string).python_version,
          (pythonVersion) => pythonVersion,
        ),
        values,
      );
      return result.length !== 0;
    });
  }

  if (key === 'plugin_type') {
    filtered = filter(fixtures, (item) => {
      const result = intersectionBy(
        map(
          parseItem(item as string).plugin_types,
          (pluginTypes) => pluginTypes,
        ),
        values,
      );
      return result.length !== 0;
    });
  }

  if (key === 'open_extension') {
    filtered = filter(fixtures, (item) => {
      const result = intersectionBy(
        map(
          parseItem(item as string).reader_file_extensions,
          (extensions) => extensions,
        ),
        values,
      );
      return result.length !== 0;
    });
  }

  if (key === 'save_extension') {
    filtered = filter(fixtures, (item) => {
      const result = intersectionBy(
        map(
          parseItem(item as string).writer_file_extensions,
          (extensions) => extensions,
        ),
        values,
      );
      return result.length !== 0;
    });
  }
  if (key === 'license') {
    filtered = fixtures.filter(
      (plugin: { license: string }) => plugin.license === values.toString(),
    );
    return filtered.length !== 0;
  }

  if (key === 'operating_system') {
    const operatingSystems = [[], 'Operating System :: OS Independent'];
    for (let i = 0; i < values.length; i++) {
      operatingSystems.push(OPERATING_SYSTEMS[values[i]]);
    }
    filtered = filter(fixtures, (item) => {
      const result = intersectionBy(
        map(
          parseItem(item as string).operating_system,
          (operatingSystem) => operatingSystem,
        ),
        operatingSystems,
      );
      return result.length !== 0;
    });
  }

  // sort results
  if (sortBy === 'recentlyUpdated') {
    return orderBy(
      filtered,
      [(plugin) => new Date(parseItem(plugin).release_date as string)],
      ['desc'],
    );
  } else if (sortBy === 'newest') {
    return orderBy(
      filtered,
      [(plugin) => new Date(parseItem(plugin).first_released as string)],
      ['desc'],
    );
  } else {
    return orderBy(filtered, [(plugin) => plugin.name], ['asc']);
  }
}
