import dayjs from 'dayjs';

import { RecentStats } from '@/components/ActivityDashboard/RecentStats';

export function RecentCommit() {
  const isLoading = false;
  const date = dayjs().subtract(11, 'months');

  return (
    <RecentStats
      date={date}
      infoI18nKey="activity:recentCommit.latest"
      isLoading={isLoading}
    />
  );
}
