import clsx from 'clsx';
import dayjs from 'dayjs';
import { useTranslation } from 'next-i18next';

import { Link } from '@/components/Link';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Text } from '@/components/Text';
import { I18nKeys, PluginHomePageData } from '@/types';

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

export function PluginCard({ className, metadataToShow, plugin }: Props) {
  const { t } = useTranslation(['pluginData']);

  return (
    <SkeletonLoader
      className="h-full min-h-[202px] screen-495:min-h-[224px]"
      render={() => (
        <Link
          className={clsx(
            'flex flex-col justify-between h-full',
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
              <div key={key}>
                <Text element="span" variant="bodyS">
                  {t(I18N_KEY_MAP[key] as I18nKeys<'pluginData'>)}:
                </Text>

                <Text
                  className="mr-3"
                  element="span"
                  variant="bodyS"
                  weight="bold"
                >
                  {['first_released', 'release_date'].includes(key)
                    ? dayjs(plugin[key] as string).format('DD MMMM YYYY')
                    : plugin[key]}
                </Text>
              </div>
            ))}
          </div>
        </Link>
      )}
    />
  );
}
