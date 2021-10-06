import { isEmpty } from 'lodash';

import { usePluginState } from '@/context/plugin';

export interface MetadataSectionField {
  name: string;
  hasValue: boolean;
}

export interface MetadataSection {
  title: string;
  description: string;
  fields: MetadataSectionField[];
}

export function useMetadataSections(): MetadataSection[] {
  const { plugin } = usePluginState();
  return [
    {
      title: 'Name + descriptions',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: [
        {
          name: 'Plugin name',
          hasValue: !!plugin.name,
        },
        {
          name: 'Brief description',
          hasValue: !!plugin.summary,
        },
        {
          name: 'Plugin description using hub-specific template',
          hasValue: !!plugin.description,
        },
        {
          name: 'Supported data',
          // TODO find out what this value should be
          hasValue: true,
        },
        {
          name: 'Plugin type',
          // TODO find out what this value should be
          hasValue: true,
        },
      ],
    },
    {
      title: 'Support + contact',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: [
        {
          name: 'Authors',
          hasValue: !isEmpty(plugin.authors),
        },
        {
          name: 'Project site',
          hasValue: !!plugin.project_site,
        },
        {
          name: 'Report issues site',
          hasValue: !!plugin.report_issues,
        },
        {
          name: 'Twitter handle',
          hasValue: !!plugin.twitter,
        },
        {
          name: 'Source code',
          hasValue: !!plugin.code_repository,
        },
        {
          name: 'Documentation site',
          hasValue: !!plugin.documentation,
        },
        {
          name: 'Support site',
          hasValue: !!plugin.support,
        },
      ],
    },
    {
      title: 'Development information',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: [
        {
          name: 'Version',
          hasValue: !!plugin.version,
        },
        {
          name: 'Release date',
          hasValue: !!plugin.release_date,
        },
        {
          name: 'First released',
          hasValue: !!plugin.first_released,
        },
        {
          name: 'Development Status',
          hasValue: !!plugin.development_status,
        },
        {
          name: 'License',
          hasValue: !!plugin.license,
        },
      ],
    },
    {
      title: 'Implementation requirements',
      description:
        '[Explain what these metadata help the end user understand / why useful to populate them.]',
      fields: [
        {
          name: 'Python versions supported',
          hasValue: !isEmpty(plugin.python_version),
        },
        {
          name: 'Operating system',
          hasValue: !isEmpty(plugin.operating_system),
        },
        {
          name: 'Requirements',
          hasValue: !!plugin.requirements,
        },
      ],
    },
  ];
}
