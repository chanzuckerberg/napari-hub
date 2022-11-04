import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'next-i18next';

import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import { usePluginActivity } from '@/hooks';

import { AreaChart } from './AreaChart';

export function MonthlyInstalls() {
  const [t] = useTranslation(['activity']);
  const { plugin } = usePluginState();
  const { dataPoints, isLoading } = usePluginActivity(plugin?.name, {
    enabled: !!plugin?.name,
  });

  if (isLoading) {
    return <Skeleton height="100%" variant="rectangular" />;
  }

  return (
    <section>
      <Text variant="bodyS">{t('activity:monthlyInstalls.title')}</Text>

      <div className="flex items-center mt-sds-m screen-600:mt-sds-l">
        <AreaChart data={dataPoints} yLabel={t('activity:installsTitle')} />
      </div>
    </section>
  );
}
