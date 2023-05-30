import clsx from 'clsx';
import dayjs from 'dayjs';
import { isNumber, isString } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import { Text } from '@/components/Text';
import { I18nKeys, PluginHomePageData } from '@/types';

import { Link } from '../Link';

interface Props {
  className?: string;
  metadataToShow?: (keyof PluginHomePageData)[];
  plugin: PluginHomePageData;
}

const MAX_AUTHORS_COUNT = 3;

const I18N_KEY_MAP: Partial<
  Record<keyof PluginHomePageData, I18nKeys<'pluginData'>>
> = {
  total_installs: 'pluginData:labels.totalInstalls',
  first_released: 'pluginData:labels.firstReleased',
  release_date: 'pluginData:labels.releaseDate',
};

function MetadataValue({
  pluginKey,
  plugin,
}: {
  pluginKey: keyof PluginHomePageData;
  plugin: PluginHomePageData;
}) {
  const value = plugin[pluginKey];
  const { i18n } = useTranslation();
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        notation: 'compact',
      }),
    [i18n.language],
  );

  if (
    ['first_released', 'release_date'].includes(pluginKey) &&
    isString(value)
  ) {
    return <>{dayjs(value).format('DD MMMM YYYY')}</>;
  }

  if (pluginKey === 'total_installs' && isNumber(value)) {
    return <>{formatter.format(value)}</>;
  }

  return <>plugin[pluginKey]</>;
}

export function PluginCard({ className, metadataToShow, plugin }: Props) {
  const { t } = useTranslation(['pluginData']);

  return (
    <Link
      className={clsx(
        'flex flex-col justify-between',
        'h-full min-h-[202px] screen-495:min-h-[224px]',
        'border border-hub-gray-300 hover:border-black',
        'p-sds-l',
        className,
      )}
      href={`/plugins/${plugin.name}`}
    >
      <div>
        <Text variant="h4">{plugin.display_name || plugin.name}</Text>
        <Text className="mt-sds-xs" variant="bodyS">
          {plugin.summary}
        </Text>
      </div>

      <div>
        <p>
          <Text element="span" weight="bold" variant="bodyS">
            {plugin.authors
              .slice(0, MAX_AUTHORS_COUNT)
              .map((author) => author.name)
              .join(', ')}
          </Text>

          {plugin.authors.length > MAX_AUTHORS_COUNT && (
            <>
              {' '}
              <Text className="underline mr-2" element="span" variant="bodyXS">
                +{plugin.authors.length - MAX_AUTHORS_COUNT} more
              </Text>
            </>
          )}
        </p>

        {metadataToShow?.map((key) => (
          <div key={key}>
            <Text element="span" variant="bodyS">
              {t(I18N_KEY_MAP[key] as I18nKeys<'pluginData'>)}:
            </Text>

            <Text className="mr-3" element="span" variant="bodyS" weight="bold">
              <MetadataValue plugin={plugin} pluginKey={key} />
            </Text>
          </div>
        ))}
      </div>
    </Link>
  );
}
