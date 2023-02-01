import dayjs from 'dayjs';

import { TotalStats } from '@/components/ActivityDashboard/TotalStats';

export function TotalCommits() {
  const isLoading = false;
  const commits = 32;
  const date = dayjs().subtract(11, 'months');

  return (
    <TotalStats
      count={commits}
      countI18nKey="activity:commits"
      date={date}
      infoI18nKey="activity:totalCommits.repoCreated"
      isLoading={isLoading}
    />
  );
}
