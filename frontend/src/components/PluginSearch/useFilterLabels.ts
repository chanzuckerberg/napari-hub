import { isString } from 'lodash';
import { useTranslation } from 'next-i18next';

import { FilterKey } from '@/store/search/search.store';
import { I18nPluginDataLabel } from '@/types/i18n';

export function useFilterLabels() {
  const [t] = useTranslation(['common', 'pluginData']);

  const getLabel = (label: I18nPluginDataLabel) =>
    isString(label) ? label : label.short ?? label.label;

  function getLabels(labels: Record<FilterKey, I18nPluginDataLabel>) {
    const result: Record<string, string> = {};

    for (const key of Object.keys(labels) as FilterKey[]) {
      result[key] = getLabel(labels[key]);
    }

    return result as Record<FilterKey, string>;
  }

  return getLabels({
    license: t('pluginData:labels.license'),
    operatingSystems: t('pluginData:labels.operatingSystem'),
    pythonVersions: t('pluginData:labels.pythonVersion'),
    supportedData: t('pluginData:labels.Supported data'),
    workflowStep: t('pluginData:labels.Workflow step'),
    imageModality: t('pluginData:labels.Image modality'),
    pluginType: t('pluginData:labels.pluginType'),
    readerFileExtensions: t('pluginData:labels.readerFileExtensions'),
    writerFileExtensions: t('pluginData:labels.writerFileExtensions'),
    authors: t('pluginData:labels.authors'),
  });
}
