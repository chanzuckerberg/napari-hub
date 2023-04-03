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
export function parseItem(text: unknown) {
  if (typeof text === 'object' || typeof text === 'undefined') {
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
  switch (key) {
    case 'authors': {
      filtered = filter(fixtures, (item) => {
        const result = intersectionBy(
          map(parseItem(item as string).authors, (author) => author.name),
          values,
        );
        return result.length !== 0;
      });
      break;
    }
    case 'supported_data': {
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
      break;
    }
    case 'image_modality': {
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
      break;
    }
    case 'workflow_step': {
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
      break;
    }
    case 'python_version': {
      const versions: string[] = [];
      for (let i = 0; i < values.length; i += 1) {
        versions.push(`>=${values[i]}`);
      }
      filtered = fixtures.filter(
        (plugin: { python_version: unknown }) =>
          plugin.python_version === versions.toString(),
      );
      return filtered.length !== 0;
    }
    case 'plugin_type': {
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
      break;
    }
    case 'open_extension': {
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
      break;
    }
    case 'save_extension': {
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
      break;
    }
    case 'license': {
      filtered = fixtures.filter(
        (plugin: { license: string }) => plugin.license === values.toString(),
      );
      return filtered.length !== 0;
    }
    default: {
      const operatingSystems = [[], 'Operating System :: OS Independent'];
      for (let i = 0; i < values.length; i += 1) {
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
  }

  // sort results
  switch (sortBy) {
    case 'Recently updated':
      return orderBy(
        filtered,
        [(plugin) => new Date(parseItem(plugin).release_date as string)],
        ['desc'],
      );
    case 'newest':
      return orderBy(
        filtered,
        [(plugin) => new Date(parseItem(plugin).first_released as string)],
        ['desc'],
      );
    default:
      return orderBy(filtered, [(plugin) => parseItem(plugin).name], ['asc']);
  }
}
