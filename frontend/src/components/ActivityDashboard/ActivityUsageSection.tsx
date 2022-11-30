import { useTranslation } from 'next-i18next';

import { ActivitySection } from './ActivitySection';
import { MonthlyInstalls } from './MonthlyInstalls/MonthlyInstalls';
import { RecentInstalls } from './RecentInstalls';
import { TotalInstalls } from './TotalInstalls';

export function ActivityUsageSection() {
  const [t] = useTranslation(['activity']);

  return (
    <ActivitySection className="min-h-[200px]" title={t('activity:usage')}>
      <TotalInstalls />
      <RecentInstalls />
      <MonthlyInstalls />
    </ActivitySection>
  );
}
