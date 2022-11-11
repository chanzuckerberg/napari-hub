import Skeleton from '@mui/material/Skeleton';
import dayjs from 'dayjs';
import { useTranslation } from 'next-i18next';

import { AreaChart } from '@/components/ActivityDashboard/AreaChart';
import { LineTooltip } from '@/components/ActivityDashboard/AreaChart/LineTooltip';
import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import { useMediaQuery, usePluginActivity } from '@/hooks';

import { PublishedLine } from './PublishedLine';
import { useChartData } from './useChartData';
import { useVisibleMonthsTicks } from './useVisibleMonthsTicks';

export function MonthlyInstalls() {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const [t] = useTranslation(['activity']);
  const { plugin } = usePluginState();
  const { dataPoints, isLoading } = usePluginActivity(plugin?.name, {
    enabled: !!plugin?.name,
  });

  const visibleMonths = useVisibleMonthsTicks();
  const data = useChartData(
    dataPoints,
    dayjs(plugin?.release_date),
    visibleMonths,
  );

  if (isLoading) {
    return <Skeleton height="100%" variant="rectangular" />;
  }

  return (
    <section>
      <Text variant="bodyS">{t('activity:monthlyInstalls.title')}</Text>

      <div className="flex items-center mt-sds-l">
        <AreaChart
          data={data}
          yLabel={t('activity:installsTitle')}
          // height defines aspect ratio of the chart:
          // https://formidable.com/open-source/victory/guides/layout/#default-layout
          height={isScreen600 ? 238 : 180}
          lineComponents={[LineTooltip, PublishedLine]}
          xTicks={visibleMonths}
        />
      </div>
    </section>
  );
}
