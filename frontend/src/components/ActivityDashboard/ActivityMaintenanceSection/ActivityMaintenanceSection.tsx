import { useTranslation } from 'next-i18next';
import { EmptyState } from 'src/components/ActivityDashboard/EmptyState';

import { ActivitySection } from '@/components/ActivityDashboard/ActivitySection';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';

import { MonthlyCommits } from './MonthlyCommits';
import { RecentCommit } from './RecentCommit';
import { TotalCommits } from './TotalCommits';

export function ActivityMaintenanceSection() {
  const [t] = useTranslation(['activity']);
  const { plugin, repo } = usePluginState();
  const { data: metrics } = usePluginMetrics(plugin?.name);
  const stats = metrics?.maintenance.stats;

  const hasRepo = !!(
    plugin?.code_repository?.includes('github') &&
    repo.createdAt &&
    stats?.latest_commit_timestamp
  );

  return (
    <ActivitySection
      className="min-h-[200px]"
      title={t('activity:maintenance')}
      grid={hasRepo}
    >
      {hasRepo ? (
        <>
          <TotalCommits />
          <RecentCommit />
          <MonthlyCommits />
        </>
      ) : (
        <EmptyState className="h-[125px] w-full my-sds-s">
          {t('activity:noData.noCodeRepo')}
        </EmptyState>
      )}
    </ActivitySection>
  );
}
