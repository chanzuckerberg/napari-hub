import clsx from 'clsx';
import { isString } from 'lodash';
import { useTranslation } from 'next-i18next';
import { ReactNode, useMemo } from 'react';
import { useQuery } from 'react-query';

import { Link } from '@/components/Link';
import { MetadataKeys } from '@/context/plugin';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { SUPPORTED_PYTHON_VERSIONS } from '@/store/search/filter.store';
import { PARAM_KEY_MAP, PARAM_VALUE_MAP } from '@/store/search/queryParameters';
import { SpdxLicenseResponse } from '@/store/search/types';
import { PluginType, PluginWriterSaveLayer } from '@/types';
import { spdxLicenseDataAPI } from '@/utils/spdx';

import styles from './MetadataList.module.scss';
import { MetadataListTextItem } from './MetadataListTextItem';

type MetadataLinkKeys = MetadataKeys | 'supportedData';

interface Props {
  children: ReactNode;
  className?: string;
  metadataKey: MetadataLinkKeys;
}

/**
 * Gets the the label to use when rendering a metadata value. If the metadata
 * has no associated value label, then the value is used directly.
 */
function useMetadataValueLabel(
  key?: MetadataLinkKeys,
  value?: ReactNode,
): ReactNode {
  const { t } = useTranslation(['pluginData']);

  if (!key || typeof value !== 'string') {
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
      switch (value) {
        case 'linux':
          return 'Linux';

        case 'windows':
          return 'Windows';

        case 'mac':
          return 'MacOS';

        default:
          return value;
      }

    default:
      return value;
  }
}

/**
 * Allowlist of metadata that has an associated filter on the search page.
 */
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
 * Component for rendering a metadata value.
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

    if (!isString(value)) {
      return result;
    }

    if (isOsiApproved) {
      result = PARAM_VALUE_MAP.openSource;
    } else if (metadataKey === 'pythonVersion') {
      for (const version of SUPPORTED_PYTHON_VERSIONS) {
        if (value.includes(version)) {
          result = version;
          break;
        }
      }
    } else if (metadataKey !== 'license') {
      result = PARAM_VALUE_MAP[value] ?? value;
    }

    return result;
  }, [isOsiApproved, metadataKey, value]);

  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');
  const url = useMemo(() => {
    const paramKey = PARAM_KEY_MAP[metadataKey] ?? metadataKey;
    return (
      filterValue &&
      `${
        isHomePageRedesign ? '/plugins' : '/'
      }?${paramKey}=${encodeURIComponent(filterValue)}`
    );
  }, [filterValue, isHomePageRedesign, metadataKey]);

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
