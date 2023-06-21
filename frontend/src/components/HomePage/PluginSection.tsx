import clsx from 'clsx';
import { ComponentType, ReactNode } from 'react';

import { IconProps } from '@/components/icons/icons.type';
import { Link } from '@/components/Link';
import { Text } from '@/components/Text';
import { PluginHomePageData } from '@/types';

import { PluginCard } from './PluginCard';

interface Props {
  icon: ComponentType<IconProps>;
  title: ReactNode;
  seeAllLink: string;
  plugins: PluginHomePageData[];
  metadataToShow?: (keyof PluginHomePageData)[];
}

export function PluginSection({
  icon: Icon,
  title,
  seeAllLink,
  plugins,
  metadataToShow,
}: Props) {
  return (
    <div className="col-span-2 screen-875:col-span-3 screen-1425:col-start-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-sds-s">
          <Icon className="w-sds-xl h-sds-xl" />
          <Text variant="h2">{title}</Text>
        </div>

        <Link className="underline" href={seeAllLink}>
          See all
        </Link>
      </div>

      <div
        className={clsx(
          'justify-center gap-sds-l min-h-[224px] mt-sds-l',
          'grid grid-cols-1 screen-600:grid-cols-2 screen-875:grid-cols-3',
        )}
      >
        {plugins.map((plugin, index) => (
          <PluginCard
            className={clsx(index === 2 && 'hidden screen-875:flex')}
            key={plugin.name}
            plugin={plugin}
            metadataToShow={metadataToShow}
          />
        ))}
      </div>
    </div>
  );
}
