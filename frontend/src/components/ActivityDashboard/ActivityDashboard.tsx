import { useMemo } from 'react';

import { I18n } from '@/components/I18n';
import { Text } from '@/components/Text';
import { PREVIEW } from '@/constants/env';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

import { ActivityMaintenanceSection } from './ActivityMaintenanceSection';
import { ActivityUsageSection } from './ActivityUsageSection';
import { EmptyState } from './EmptyState';

export function ActivityDashboard() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(
    PREVIEW ? undefined : plugin?.name,
  );
  const isMaintenanceVisible = useIsFeatureFlagEnabled(
    'activityDashboardMaintenance',
  );

  const isEmpty = useMemo(() => {
    if (isLoading) {
      return false;
    }

    if (!metrics) {
      return true;
    }

    const { timeline, stats } = metrics.usage;

    // Check if timeline is empty and all stats values are 0
    return [timeline.length, Object.values(stats)].every(
      (value) => value === 0,
    );
  }, [isLoading, metrics]);

  return (
    <div>
      {isEmpty ? (
        <EmptyState className="h-[75px] screen-495:h-[125px]">
          <I18n
            i18nKey={
              PREVIEW ? 'activity:noData.preview' : 'activity:noData.allData'
            }
          />
        </EmptyState>
      ) : (
        <>
          <ActivityUsageSection />
          {isMaintenanceVisible && <ActivityMaintenanceSection />}

          <Text variant="bodyS">
            <I18n i18nKey="activity:learnMore" />
          </Text>
        </>
      )}
    </div>
  );
}
