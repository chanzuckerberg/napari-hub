import clsx from 'clsx';
import { isString } from 'lodash';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';
import { useQuery } from 'react-query';

import { spdxLicenseDataAPI } from '@/axios';
import { MetadataKeys } from '@/context/plugin';
import { SUPPORTED_PYTHON_VERSIONS } from '@/store/search/filter.store';
import { PARAM_KEY_MAP, PARAM_VALUE_MAP } from '@/store/search/queryParameters';
import { SpdxLicenseResponse } from '@/store/search/types';
import { PluginType, PluginWriterSaveLayer } from '@/types';

import { Link } from '../common/Link';
import styles from './MetadataList.module.scss';

type MetadataLinkKeys = MetadataKeys | 'supportedData';

interface Props {
  children: ReactNode;
  className?: string;
  metadataKey: MetadataLinkKeys;
}

function useMetadataValueLabel(
  key?: MetadataLinkKeys,
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

const METADATA_FILTER_LINKS = new Set<MetadataLinkKeys>([
  'license',
  'pythonVersion',
]);

/**
 * Component for rendering text items in metadata lists.
 */
export function MetadataListTextItem({
  children,
  className,
  metadataKey,
}: Props) {
  const valueLabel = useMetadataValueLabel(metadataKey, children);

  // Fetch SDPX license data to check if current license is OSI Approved.
  const { data: licenses } = useQuery(
    ['spdx'],
    async () => {
      const { data } = await spdxLicenseDataAPI.get<SpdxLicenseResponse>('');
      return data.licenses;
    },
    { enabled: metadataKey === 'license' },
  );

  const isOsiApproved =
    metadataKey === 'license' &&
    isString(children) &&
    licenses?.some(
      (license) => license.licenseId === children && license.isOsiApproved,
    );

  let filterValue: string | undefined;

  if (isString(children)) {
    if (isOsiApproved) {
      filterValue = PARAM_VALUE_MAP.openSource;
    } else if (metadataKey === 'pythonVersion') {
      for (const version of SUPPORTED_PYTHON_VERSIONS) {
        if (children.includes(version)) {
          filterValue = version;
          break;
        }
      }
    } else if (metadataKey !== 'license') {
      filterValue = PARAM_VALUE_MAP[children] ?? children;
    }
  }
  const paramKey = PARAM_KEY_MAP[metadataKey] ?? metadataKey;
  const url = filterValue && `/?${paramKey}=${encodeURIComponent(filterValue)}`;

  return (
    <li className={clsx(styles.textItem, className)}>
      {url && METADATA_FILTER_LINKS.has(metadataKey) ? (
        <Link
          className={clsx(styles.textItem, className, 'underline')}
          href={url}
        >
          {valueLabel}
        </Link>
      ) : (
        valueLabel
      )}
    </li>
  );
}
