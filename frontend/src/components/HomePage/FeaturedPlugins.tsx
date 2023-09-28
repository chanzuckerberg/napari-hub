import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ComponentType } from 'react';

import {
  FileReader,
  FileWriter,
  Newest,
  RecentlyUpdated,
  SampleData,
  Widget,
} from '@/components/icons';
import { IconProps } from '@/components/icons/icons.type';
import { useLoadingState } from '@/context/loading';
import { PluginHomePageData, PluginType } from '@/types';

import { SkeletonLoader } from '../SkeletonLoader';
import { useHomePage } from './context';
import { PluginSection } from './PluginSection';

const PLUGIN_TYPE_TO_ICON_MAP: Record<PluginType, ComponentType<IconProps>> = {
  [PluginType.Reader]: FileReader,
  [PluginType.SampleData]: SampleData,
  [PluginType.Theme]: () => null,
  [PluginType.Widget]: Widget,
  [PluginType.Writer]: FileWriter,
};

// TODO Replace metadata key with specific one associated with plugin type when
// data is available on the backend.
const PLUGIN_TYPE_TO_METADATA_KEY: Record<
  PluginType,
  keyof PluginHomePageData
> = {
  [PluginType.Reader]: 'total_installs',
  [PluginType.SampleData]: 'total_installs',
  [PluginType.Theme]: 'total_installs',
  [PluginType.Widget]: 'total_installs',
  [PluginType.Writer]: 'total_installs',
};

export function FeaturedPlugins() {
  const { pluginSections } = useHomePage();
  const { t } = useTranslation(['homePage']);
  const pluginTypeLabels = t('homePage:pluginTypeLabels');
  const isLoading = useLoadingState();

  const {
    plugin_types: pluginTypeSection,
    newest: newestSection,
    recently_updated: recentlyUpdatedSection,
  } = pluginSections;

  return (
    <div
      className={clsx(
        'grid justify-center',

        // Grid gap
        'gap-6 screen-495:gap-12',

        // Padding
        'py-sds-xl px-6 screen-495:px-12',

        // Grid columns
        'grid-cols-2',
        'screen-875:grid-cols-napari-3',
        'screen-1425:grid-cols-napari-5',
      )}
    >
      {pluginTypeSection && (
        <PluginSection
          iconLoading={isLoading}
          icon={PLUGIN_TYPE_TO_ICON_MAP[pluginTypeSection.type]}
          plugins={pluginTypeSection.plugins}
          pluginType={pluginTypeSection.type}
          row={0}
          section={t('homePage:pluginSectionTitles.pluginTypes', {
            type: pluginTypeLabels[pluginTypeSection.type],
          })}
          seeAllLink={`/plugins?pluginType=${pluginTypeSection.type}`}
          title={
            <span className="flex items-center gap-x-sds-s">
              <SkeletonLoader className="w-[60px]" />
              {t('homePage:pluginSectionTitles.pluginTypes', {
                type: isLoading ? '' : pluginTypeLabels[pluginTypeSection.type],
              })}
            </span>
          }
          metadataToShow={[PLUGIN_TYPE_TO_METADATA_KEY[pluginTypeSection.type]]}
        />
      )}

      {newestSection && (
        <PluginSection
          icon={Newest}
          metadataToShow={['first_released']}
          plugins={newestSection.plugins}
          row={1}
          section={t('homePage:newest')}
          seeAllLink="/plugins?sort=newest"
          title={t('homePage:newest')}
        />
      )}

      {recentlyUpdatedSection && (
        <PluginSection
          icon={RecentlyUpdated}
          metadataToShow={['release_date']}
          plugins={recentlyUpdatedSection.plugins}
          row={2}
          section={t('homePage:recentlyUpdated')}
          seeAllLink="/plugins?sort=recentlyUpdated"
          title={t('homePage:recentlyUpdated')}
        />
      )}
    </div>
  );
}
