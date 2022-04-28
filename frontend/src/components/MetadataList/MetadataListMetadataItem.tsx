import clsx from 'clsx';
import { isString } from 'lodash';
import { useTranslation } from 'next-i18next';
import { ReactNode, useMemo } from 'react';
import { useQuery } from 'react-query';

import { spdxLicenseDataAPI } from '@/axios';
import { MetadataKeys } from '@/context/plugin';
import {
  FILTER_OS_PATTERN,
  SUPPORTED_PYTHON_VERSIONS,
} from '@/store/search/filter.store';
import { PARAM_KEY_MAP, PARAM_VALUE_MAP } from '@/store/search/queryParameters';
import { SpdxLicenseResponse } from '@/store/search/types';
import { PluginType, PluginWriterSaveLayer } from '@/types';

import { Link } from '../common/Link';
import styles from './MetadataList.module.scss';
import { MetadataListTextItem } from './MetadataListTextItem';

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

    case 'operatingSystems':
      return value.split(' :: ').at(-1);

    default:
      return value;
  }
}

const METADATA_FILTER_LINKS = new Set<MetadataLinkKeys>([
  'authors',
  'license',
  'operatingSystems',
  'pluginType',
  'pythonVersion',
  'readerFileExtensions',
  'supportedData',
  'writerFileExtensions',
  'writerSaveLayers',
]);

/**
 * Component for rendering text items in metadata lists.
 */
export function MetadataListMetadataItem({
  children: value,
  className,
  metadataKey,
}: Props) {
  const valueLabel = useMetadataValueLabel(metadataKey, value);

  // Fetch SDPX license data to check if current license is OSI Approved.
  const { data: licenses } = useQuery(
    ['spdx'],
    async () => {
      const { data } = await spdxLicenseDataAPI.get<SpdxLicenseResponse>('');
      return data.licenses;
    },
    { enabled: metadataKey === 'license' },
  );

  const isOsiApproved = useMemo(
    () =>
      metadataKey === 'license' &&
      isString(value) &&
      licenses?.some(
        (license) => license.licenseId === value && license.isOsiApproved,
      ),
    [licenses, metadataKey, value],
  );

  const filterValue = useMemo(() => {
    let result: string | undefined;

    if (isString(value)) {
      if (isOsiApproved) {
        result = PARAM_VALUE_MAP.openSource;
      } else if (metadataKey === 'pythonVersion') {
        for (const version of SUPPORTED_PYTHON_VERSIONS) {
          if (value.includes(version)) {
            result = version;
            break;
          }
        }
      } else if (metadataKey === 'operatingSystems') {
        if (FILTER_OS_PATTERN.windows.exec(value)) {
          result = 'windows';
        } else if (FILTER_OS_PATTERN.mac.exec(value)) {
          result = 'macos';
        } else if (FILTER_OS_PATTERN.linux.exec(value)) {
          result = 'linux';
        }
      } else if (metadataKey !== 'license') {
        result = PARAM_VALUE_MAP[value] ?? value;
      }
    }

    return result;
  }, [isOsiApproved, metadataKey, value]);

  const url = useMemo(() => {
    const paramKey = PARAM_KEY_MAP[metadataKey] ?? metadataKey;
    return filterValue && `/?${paramKey}=${encodeURIComponent(filterValue)}`;
  }, [filterValue, metadataKey]);

  return (
    <MetadataListTextItem>
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
    </MetadataListTextItem>
  );
}
