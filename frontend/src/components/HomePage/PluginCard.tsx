import clsx from 'clsx';
import dayjs from 'dayjs';
import { isNumber, isString } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import { Link } from '@/components/Link';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Text } from '@/components/Text';
import { usePlausible } from '@/hooks';
import { I18nKeys, PluginHomePageData, PluginType } from '@/types';

interface Props {
  className?: string;
  column: number;
  metadataToShow?: (keyof PluginHomePageData)[];
  plugin: PluginHomePageData;
  pluginType?: PluginType;
  row: number;
  section: string;
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

export function PluginCard({
  className,
  column,
  metadataToShow,
  plugin,
  pluginType,
  row,
  section,
}: Props) {
  const { t } = useTranslation(['pluginData']);
  const plausible = usePlausible();

  return (
    <SkeletonLoader
      className="h-full min-h-[202px] screen-495:min-h-[224px]"
      render={() => (
        <Link
          className={clsx(
            'flex flex-col justify-between h-full gap-sds-l',
            'border border-hub-gray-300 hover:border-black',
            'p-sds-l',
            className,
          )}
          href={`/plugins/${plugin.name}`}
          onClick={() =>
            plausible('Home Plugin Section Click', {
              row,
              column,
              plugin_name: plugin.name,
              section,

              // Only add `plugin_type` to payload if defined
              ...(typeof pluginType === 'string'
                ? { plugin_type: pluginType }
                : {}),
            })
          }
        >
          <div>
            <Text variant="h4">{plugin.display_name || plugin.name}</Text>
            <Text className="mt-sds-xs" variant="bodyS">
              {plugin.summary}
            </Text>
          </div>

          <div className="flex flex-col gap-sds-l">
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
                  <Text
                    className="underline mr-2"
                    element="span"
                    variant="bodyXS"
                  >
                    +{plugin.authors.length - MAX_AUTHORS_COUNT} more
                  </Text>
                </>
              )}
            </p>

            {metadataToShow?.map((key) => (
              <div className="flex items-center gap-1" key={key}>
                <Text element="span" variant="bodyS">
                  {t(I18N_KEY_MAP[key] as I18nKeys<'pluginData'>) as string}:
                </Text>

                <Text
                  className="mr-3"
                  element="span"
                  variant="bodyS"
                  weight="bold"
                >
                  <MetadataValue plugin={plugin} pluginKey={key} />
                </Text>
              </div>
            ))}
          </div>
        </Link>
      )}
    />
  );
}
