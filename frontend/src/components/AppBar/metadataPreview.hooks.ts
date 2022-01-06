import { isArray, isEmpty, isString } from 'lodash';
import { useTranslation } from 'next-i18next';

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

export function useMetadataSections(): MetadataSection[] {
  const metadata = usePluginMetadata();
  const [t] = useTranslation(['preview']);

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
        name: data.previewLabel,
      };
    });
  }

  function getSection({
    section,
    fields,
  }: {
    section: { title: string; description: string };
    fields: MetadataKeys[];
  }) {
    return {
      title: section.title,
      description: section.description,
      fields: getFields(...fields),
    };
  }

  return [
    getSection({
      section: t('preview:sections.describeWhat'),
      fields: ['name', 'summary', 'description', 'authors'],
    }),

    getSection({
      section: t('preview:sections.tellUsers'),
      fields: ['name', 'summary', 'description', 'authors'],
    }),

    getSection({
      section: t('preview:sections.giveInsight'),
      fields: ['sourceCode', 'license', 'version'],
    }),

    getSection({
      section: t('preview:sections.specifySystem'),
      fields: ['pythonVersion', 'operatingSystems', 'requirements'],
    }),
  ];
}
