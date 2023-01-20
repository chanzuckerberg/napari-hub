import { useTranslation } from 'next-i18next';

import { ActivitySection } from '@/components/ActivityDashboard/ActivitySection';

import { MonthlyCommits } from './MonthlyCommits';
import { RecentCommit } from './RecentCommit';
import { TotalCommits } from './TotalCommits';

export function ActivityMaintenanceSection() {
  const [t] = useTranslation(['activity']);

  return (
    <ActivitySection
      className="min-h-[200px]"
      title={t('activity:maintenance')}
    >
      <TotalCommits />
      <RecentCommit />
      <MonthlyCommits />
    </ActivitySection>
  );
}
