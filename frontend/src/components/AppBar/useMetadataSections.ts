import { isArray, isEmpty, isString } from 'lodash';
import { useTranslation } from 'next-i18next';

import { MetadataId, MetadataKeys, usePluginMetadata } from '@/context/plugin';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { I18nPreviewSection } from '@/types/i18n';

export interface MetadataSectionField {
  id: MetadataId;
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
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');

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
        id: `metadata-${key}`,
        name: data.label,
      } as MetadataSectionField;
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

  interface GetSectionInputData {
    section: I18nPreviewSection;
    fields: MetadataKeys[];
  }

  function getSections(...sections: GetSectionInputData[]) {
    return sections.map(getSection);
  }

  return getSections(
    {
      section: t('preview:sections.describeWhat'),
      fields: [
        isNpe2Enabled ? 'displayName' : 'name',
        'summary',
        'description',
        'authors',
      ],
    },

    {
      section: t('preview:sections.tellUsers'),
      fields: ['documentationSite', 'supportSite', 'reportIssues'],
    },

    {
      section: t('preview:sections.giveInsight'),
      fields: ['sourceCode', 'license', 'version'],
    },

    {
      section: t('preview:sections.specifySystem'),
      fields: ['pythonVersion', 'operatingSystems', 'requirements'],
    },
  );
}
