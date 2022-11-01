import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { DeepPartial } from 'utility-types';

import { Props as ActivityDashboardProps } from '@/components/ActivityDashboard';
import { Markdown } from '@/components/Markdown';
import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import {
  useMediaQuery,
  usePluginActivity,
  usePluginInstallStats,
} from '@/hooks';
import { PluginData } from '@/types';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';

import { CallToActionButton } from './CallToActionButton';
import { CitationInfo } from './CitationInfo';
import { PluginMetadata } from './PluginMetadata';

const ActivityDashboard = dynamic<ActivityDashboardProps>(
  () =>
    import('@/components/ActivityDashboard').then(
      (mod) => mod.ActivityDashboard,
    ),
  { ssr: false },
);
interface Props {
  isEmptyDescription: boolean;
  plugin?: DeepPartial<PluginData>;
}

/**
 * Current layout of the plugin page that includes the description, citation,
 * and activity dashboard. This component will be deprecated as when the
 * activity dashboard is fully rolled out to production.
 */
export function PluginPageContent({ isEmptyDescription, plugin }: Props) {
  const [t] = useTranslation(['preview']);
  const hasPluginMetadataScroll = useMediaQuery({ maxWidth: 'screen-1425' });
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const { dataPoints } = usePluginActivity(plugin?.name);
  const { pluginStats } = usePluginInstallStats(plugin?.name);

  return (
    <>
      <SkeletonLoader
        className="h-[600px] mb-sds-xxl"
        render={() => (
          <MetadataHighlighter
            metadataId="metadata-description"
            className="flex items-center justify-between mb-sds-xxl"
            highlight={isEmptyDescription}
          >
            <Markdown disableHeader placeholder={isEmptyDescription}>
              {plugin?.description || t('preview:emptyDescription')}
            </Markdown>
          </MetadataHighlighter>
        )}
      />

      <div className="mb-6 screen-495:mb-12 screen-1150:mb-20">
        <CallToActionButton />
        {plugin?.citations && <CitationInfo className="mt-sds-xxl" />}
      </div>

      <PluginMetadata
        enableScrollID={hasPluginMetadataScroll}
        className="screen-1425:hidden"
        inline
      />

      {isActivityDashboardEnabled && plugin?.name && (
        <ActivityDashboard
          data={dataPoints}
          installCount={pluginStats?.totalInstalls ?? 0}
          installMonthCount={pluginStats?.totalMonths ?? 0}
        />
      )}
    </>
  );
}
