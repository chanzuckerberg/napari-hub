import clsx from 'clsx';
import { useTranslation } from 'next-i18next';

import {
  Newest,
  RecentlyUpdated,
  SampleData,
  TrendingInstalls,
} from '@/components/icons';
import { useLoadingState } from '@/context/loading';

import { SkeletonLoader } from '../SkeletonLoader';
import { useHomePage } from './context';
import { PluginSection } from './PluginSection';

export function FeaturedPlugins() {
  const { pluginSections } = useHomePage();
  const { t } = useTranslation(['homePage']);
  const pluginTypeLabels = t('homePage:pluginTypeLabels');
  const isLoading = useLoadingState();

  const {
    plugin_types: pluginTypeSection,
    newest: newestSection,
    recently_updated: recentlyUpdatedSection,
    top_installed: topInstallsSection,
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
          icon={SampleData}
          plugins={pluginTypeSection.plugins}
          seeAllLink={`/plugins?pluginType=${pluginTypeSection.type}`}
          title={
            <span className="flex items-center gap-x-sds-s">
              <SkeletonLoader className="w-[60px]" />
              {t('homePage:pluginSectionTitles.pluginTypes', {
                type: isLoading ? '' : pluginTypeLabels[pluginTypeSection.type],
              })}
            </span>
          }
          metadataToShow={['total_installs']}
        />
      )}

      {newestSection && (
        <PluginSection
          icon={Newest}
          plugins={newestSection.plugins}
          seeAllLink="/plugins?sort=newest"
          title={t('homePage:newest')}
          metadataToShow={['first_released']}
        />
      )}

      {recentlyUpdatedSection && (
        <PluginSection
          icon={RecentlyUpdated}
          plugins={recentlyUpdatedSection.plugins}
          seeAllLink="/plugins?sort=recentlyUpdated"
          title={t('homePage:recentlyUpdated')}
          metadataToShow={['release_date']}
        />
      )}

      {topInstallsSection && (
        <PluginSection
          icon={TrendingInstalls}
          plugins={topInstallsSection.plugins}
          seeAllLink="/plugins?sort=totalInstalls"
          title={t('homePage:pluginSectionTitles.trendingInstalls')}
          metadataToShow={['total_installs']}
        />
      )}
    </div>
  );
}
