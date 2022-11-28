import Skeleton from '@mui/material/Skeleton';
import dayjs from 'dayjs';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import { AreaChart } from '@/components/ActivityDashboard/AreaChart';
import { LineTooltip } from '@/components/ActivityDashboard/AreaChart/LineTooltip';
import { EmptyState } from '@/components/ActivityDashboard/EmptyState';
import { I18n } from '@/components/I18n';
import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import { useMediaQuery, usePluginMetrics } from '@/hooks';
import { DataPoint } from '@/types/stats';

import { PublishedLine } from './PublishedLine';
import { useChartData } from './useChartData';
import { useVisibleMonthsTicks } from './useVisibleMonthsTicks';

export function MonthlyInstalls() {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const [t] = useTranslation(['activity']);
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);

  const visibleMonths = useVisibleMonthsTicks();
  const dataPoints = useMemo<DataPoint[]>(
    () =>
      metrics?.activity.timeline.map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: point.installs,
      })) ?? [],
    [metrics?.activity.timeline],
  );
  const chartData = useChartData(
    dataPoints,
    dayjs(plugin?.first_released),
    visibleMonths,
  );

  if (isLoading) {
    return <Skeleton height="100%" variant="rectangular" />;
  }

  const isEmpty = chartData.every((point) => point.y === null);

  return (
    <section>
      <Text variant="bodyS">{t('activity:monthlyInstalls.title')}</Text>

      <div className="flex items-center mt-sds-l">
        {isEmpty ? (
          <EmptyState className="flex-auto h-[70px] screen-495:h-[120px]">
            <I18n i18nKey="activity:noData.monthlyInstalls" />
          </EmptyState>
        ) : (
          <AreaChart
            data={chartData}
            yLabel={t('activity:installsTitle')}
            // height defines aspect ratio of the chart:
            // https://formidable.com/open-source/victory/guides/layout/#default-layout
            height={isScreen600 ? 238 : 180}
            lineComponents={[LineTooltip, PublishedLine]}
            xTicks={visibleMonths}
          />
        )}
      </div>
    </section>
  );
}
