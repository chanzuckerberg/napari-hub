import { satisfies } from '@renovate/pep440';
import { isArray, isString } from 'lodash';
import { useTranslation } from 'next-i18next';
import { createContext, ReactNode, useContext } from 'react';
import { DeepPartial } from 'utility-types';

import { SUPPORTED_PYTHON_VERSIONS } from '@/store/search/filter.store';
import { SpdxLicenseData } from '@/store/search/types';
import {
  HubDimension,
  PluginData,
  PluginRepoData,
  PluginRepoFetchError,
  PluginType,
  PluginWriterSaveLayer,
} from '@/types';
import { I18nPluginDataLabel } from '@/types/i18n';
import { formatDate } from '@/utils';

/**
 * Shared state for plugin data.
 */
interface PluginState {
  licenses?: SpdxLicenseData[];
  plugin?: DeepPartial<PluginData>;
  repo: PluginRepoData;
  repoFetchError?: PluginRepoFetchError;
}

const PluginStateContext = createContext<PluginState | null>(null);

interface Props extends PluginState {
  children: ReactNode;
}

/**
 * Provider for plugin state.  This allows child components to access the
 * plugin state directly from context so that we don't have to pass the
 * `plugin` prop around everywhere.
 */
export function PluginStateProvider({ children, ...props }: Props) {
  return (
    <PluginStateContext.Provider value={props}>
      {children}
    </PluginStateContext.Provider>
  );
}

/**
 * Hook for accessing the plugin state context.  This allows components to
 * access the plugin data from anywhere.
 *
 * @returns The plugin state
 */
export function usePluginState(): PluginState {
  const context = useContext(PluginStateContext);

  if (!context) {
    throw new Error('usePluginState must be used in a PluginStateProvider');
  }

  return context;
}

/**
 * Input data for the `getMetadataLabels()` function.
 */
type WithLabelsInputData<V> = {
  label?: I18nPluginDataLabel;
  value: V;
};

/**
 * Output data for the `getMetadataLabels()` function.
 */
type WithLabelsResult<V> = {
  label: string;
  value: V;
};

/**
 * Helper conditional type that replaces an indexable object mapped to
 * `WithLabelsInputData` with `WithLabelsResult`.
 */
type WithLabels<T> = {
  // If the value of T[K] is type `WithLabelsInputData<V>`, then convert it to a
  // `WithLabelsResult<V>` type. The type V is inferred so that the metadata
  // value type will be maintained.
  [K in keyof T]: T[K] extends WithLabelsInputData<infer V>
    ? WithLabelsResult<V>
    : never;
};

/**
 * Helper function to attach plugin metadata labels to the metadata object.
 *
 * @param metadata The plugin metadata.
 * @returns  The plugin metadata with labels.
 */
function getMetadataLabels<
  T extends {
    [key in keyof T]: WithLabelsInputData<unknown>;
  },
>(metadata: T) {
  const result: Record<string, WithLabelsResult<unknown>> = {};

  for (const [key, labelData] of Object.entries(metadata)) {
    const { label, value } = labelData as WithLabelsInputData<unknown>;
    result[key] = {
      value,

      // Add labels to plugin metadata.
      ...(isString(label) ? { label } : { label: label?.label ?? '' }),
    };
  }

  return result as WithLabels<T>;
}

/**
 * Hook for accessing plugin metadata and related information. This serves as a
 * single-source of truth for plugin metadata so that multiple features can
 * reference the same data, and therefore allow us to colocate extra information
 * in this same object.
 *
 * TODO Refactor usages `usePluginState()` to use this hook.
 *
 * @returns The plugin metadata.
 */
export function usePluginMetadata() {
  const [t] = useTranslation(['pluginData']);
  const { plugin } = usePluginState();

  function getCategoryValue(dimension: HubDimension): string[] {
    return (
      plugin?.category ? plugin.category[dimension] ?? [] : []
    ) as string[];
  }

  return getMetadataLabels({
    name: {
      label: t('pluginData:labels.pluginName'),
      value: plugin?.name ?? '',
    },

    displayName: {
      label: t('pluginData:labels.displayName'),
      value: plugin?.display_name ?? '',
    },

    summary: {
      label: t('pluginData:labels.summary'),
      value: plugin?.summary ?? '',
    },

    description: {
      label: t('pluginData:labels.description'),
      value: plugin?.description ?? '',
    },

    releaseDate: {
      label: t('pluginData:labels.releaseDate'),
      value: plugin?.release_date ? formatDate(plugin.release_date) : '',
    },

    firstReleased: {
      label: t('pluginData:labels.firstReleased'),
      value: plugin?.first_released ? formatDate(plugin.first_released) : '',
    },

    authors: {
      label: t('pluginData:labels.authors'),
      value:
        plugin?.authors && isArray(plugin.authors)
          ? plugin.authors
              ?.map((author) => author.name)
              .filter((name): name is string => !!name)
          : [],
    },

    projectSite: {
      label: t('pluginData:labels.projectSite'),
      value: plugin?.project_site ?? '',
    },

    reportIssues: {
      label: t('pluginData:labels.reportIssues'),
      value: plugin?.report_issues ?? '',
    },

    twitter: {
      label: t('pluginData:labels.twitter'),
      value: plugin?.twitter ?? '',
    },

    sourceCode: {
      label: t('pluginData:labels.sourceCode'),
      value: plugin?.code_repository ?? '',
    },

    supportSite: {
      label: t('pluginData:labels.supportSite'),
      value: plugin?.support ?? '',
    },

    documentationSite: {
      label: t('pluginData:labels.documentation'),
      value: plugin?.documentation ?? '',
    },

    version: {
      label: t('pluginData:labels.version'),
      value: plugin?.version ?? '',
    },

    license: {
      label: t('pluginData:labels.license'),
      value: plugin?.license ?? '',
    },

    pythonVersion: {
      label: t('pluginData:labels.pythonVersion'),
      value: SUPPORTED_PYTHON_VERSIONS.filter((version) =>
        satisfies(version, plugin?.python_version ?? ''),
      ),
    },

    operatingSystems: {
      label: t('pluginData:labels.operatingSystem'),
      value: Array.from(
        new Set(
          plugin?.operating_system && isArray(plugin.operating_system)
            ? plugin.operating_system
                .map((operatingSystem) =>
                  operatingSystem?.replace('Operating System :: ', ''),
                )
                .filter((value): value is string => !!value)
                .flatMap((operatingSystem) => {
                  switch (true) {
                    case operatingSystem.includes('Linux') ||
                      operatingSystem.includes('POSIX'):
                      return 'linux';

                    case operatingSystem.includes('Windows'):
                      return 'windows';

                    case operatingSystem.includes('MacOS'):
                      return 'mac';

                    case operatingSystem === 'OS Independent':
                      return ['linux', 'windows', 'mac'];

                    default:
                      return operatingSystem;
                  }
                })
                .sort()
            : [],
        ),
      ),
    },

    requirements: {
      label: t('pluginData:labels.requirements'),
      value:
        plugin?.requirements && isArray(plugin.requirements)
          ? plugin.requirements.filter(
              (req): req is string => !req?.includes(' extra == '),
            )
          : [],
    },

    citations: {
      label: t('pluginData:labels.citations'),
      value: plugin?.citations,
    },

    actionRepository: {
      value: plugin?.action_repository ?? '',
    },

    workflowSteps: {
      label: t('pluginData:labels.Workflow step'),
      value: getCategoryValue('Workflow step'),
    },

    imageModality: {
      label: t('pluginData:labels.Image modality'),
      value: getCategoryValue('Image modality'),
    },

    supportedData: {
      label: t('pluginData:labels.Supported data'),
      value: getCategoryValue('Supported data'),
    },

    pluginType: {
      label: t('pluginData:labels.pluginType'),
      value: (plugin?.plugin_types ?? []) as PluginType[],
    },

    readerFileExtensions: {
      label: t('pluginData:labels.readerFileExtensions'),
      value: (plugin?.reader_file_extensions ?? []) as string[],
    },

    writerFileExtensions: {
      label: t('pluginData:labels.writerFileExtensions'),
      value: (plugin?.writer_file_extensions ?? []) as string[],
    },

    writerSaveLayers: {
      label: t('pluginData:labels.writerSaveLayers'),
      value: (plugin?.writer_save_layers ?? []) as PluginWriterSaveLayer[],
    },
  });
}

export type Metadata = ReturnType<typeof usePluginMetadata>;

export type MetadataKeys = keyof Omit<
  Metadata,
  'actionRepository' | 'workflowSteps' | 'imageModality' | 'supportedData'
>;

export type MetadataId = `metadata-${MetadataKeys}`;
