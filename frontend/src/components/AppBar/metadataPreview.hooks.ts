import { isArray, isEmpty, isString } from 'lodash';

import { MetadataKeys, usePluginMetadata } from '@/context/plugin';

export interface MetadataSectionField {
  id: MetadataKeys;
  name: string;
  hasValue: boolean;
}

export interface MetadataSection {
  title: string;
  description: string;
  fields: MetadataSectionField[];
}

function hasPreviewName<T extends { previewName: string }>(
  value: unknown,
): value is T {
  return !!(value as T).previewName;
}

export function useMetadataSections(): MetadataSection[] {
  const metadata = usePluginMetadata();

  function getFields(...keys: MetadataKeys[]) {
    return keys.map((key) => {
      const data = metadata[key];
      let hasValue = false;

      if (isString(data.value)) {
        // If value is string, check if the trimmed string is empty.
        hasValue = !isEmpty(data.value.trim());
      } else if (isArray(data.value)) {
        // If value is array, filter out empty strings after trimming, and check
        // if the array is empty.
        hasValue = !isEmpty(
          data.value.filter((value) => !isEmpty(value.trim())),
        );
      } else {
        // If value is something else, just check if it's empty.
        hasValue = !isEmpty(data.value);
      }

      return {
        hasValue,
        id: key,
        name: hasPreviewName(data) ? data.previewName : data.name,
      };
    });
  }

  return [
    {
      title: 'Name + descriptions',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: getFields(
        'name',
        'summary',
        'description',

        // TODO Future categories, disable this for now until the data is ready.
        // 'supportedData',
        // 'pluginType',
      ),
    },
    {
      title: 'Support + contact',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: getFields(
        'authors',
        // TODO Add when design for optional metadata is ready
        // 'projectSite',
        'reportIssues',
        // TODO Add when design for optional metadata is ready
        // 'twitter',
        'sourceCode',
        'documentationSite',
        'supportSite',
      ),
    },
    {
      title: 'Development information',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: getFields('version', 'license'),
    },
    {
      title: 'Implementation requirements',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: getFields('pythonVersion', 'operatingSystems', 'requirements'),
    },
  ];
}
