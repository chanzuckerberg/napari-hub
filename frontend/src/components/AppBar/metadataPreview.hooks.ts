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
      title: 'Describe what the plugin does',
      description:
        'A concise summary & clear description help users understand what your plugin does and whether it is what they are looking for.',
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
      title: 'Tell users where they can get help',
      description:
        'Make sure your users know where to go to learn how to use your plugin, get help, report bugs, or request new features.',
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
        'Let users see your source code and know what kind of stability they should expect.',
      fields: getFields('version', 'license'),
    },
    {
      title: 'Implementation requirements',
      description:
        'Make the technical requirements of your plugin clear so users will know if it they can install it.',
      fields: getFields('pythonVersion', 'operatingSystems', 'requirements'),
    },
  ];
}
