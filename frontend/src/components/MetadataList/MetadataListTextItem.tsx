import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

import { MetadataKeys } from '@/context/plugin';
import { PluginType, PluginWriterSaveLayer } from '@/types';

import styles from './MetadataList.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
  metadataKey?: MetadataKeys;
}

function useMetadataValueLabel(
  key?: MetadataKeys,
  value?: ReactNode,
): ReactNode {
  const { t } = useTranslation(['pluginData']);

  if (!key) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  switch (key) {
    case 'pluginType':
      switch (value) {
        case PluginType.Reader:
          return t('pluginData:labels.pluginType.reader');

        case PluginType.Writer:
          return t('pluginData:labels.pluginType.writer');

        default:
          return value;
      }

    case 'writerSaveLayers':
      switch (value) {
        case PluginWriterSaveLayer.Image:
          return t('pluginData:labels.writerSaveLayers.image');

        case PluginWriterSaveLayer.Points:
          return t('pluginData:labels.writerSaveLayers.points');

        case PluginWriterSaveLayer.Shapes:
          return t('pluginData:labels.writerSaveLayers.shapes');

        default:
          return value;
      }

    default:
      return value;
  }
}

/**
 * Component for rendering text items in metadata lists.
 */
export function MetadataListTextItem({
  children,
  className,
  metadataKey,
}: Props) {
  const valueLabel = useMetadataValueLabel(metadataKey, children);
  return <li className={clsx(styles.textItem, className)}>{valueLabel}</li>;
}
