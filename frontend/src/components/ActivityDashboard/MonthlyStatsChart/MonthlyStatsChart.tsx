import Skeleton from '@mui/material/Skeleton';
import dayjs from 'dayjs';
import { useTranslation } from 'next-i18next';

import { AreaChart } from '@/components/ActivityDashboard/AreaChart';
import { LineTooltip } from '@/components/ActivityDashboard/AreaChart/LineTooltip';
import { EmptyState } from '@/components/ActivityDashboard/EmptyState';
import { I18n } from '@/components/I18n';
import { Text } from '@/components/Text';
import { useMediaQuery } from '@/hooks';
import { I18nKeys } from '@/types/i18n';
import { DataPoint } from '@/types/metrics';

import { MonthlyStatsProvider } from './context';
import { DateLine } from './DateLine';
import { useChartData } from './useChartData';
import { useVisibleMonthsTicks } from './useVisibleMonthsTicks';

interface Props {
  dataPoints: DataPoint[];
  dateLineI18nKey: I18nKeys<'activity'>;
  dateLineLabelYOffset?: number;
  emptyI18nKey: I18nKeys<'activity'>;
  fill?: string;
  isLoading?: boolean;
  startDate?: dayjs.ConfigType;
  titleI18nKey: I18nKeys<'activity'>;
  yLabelI18nKey: I18nKeys<'activity'>;
}

export function MonthlyStatsChart({
  dataPoints,
  dateLineI18nKey,
  dateLineLabelYOffset = 0,
  emptyI18nKey,
  fill,
  isLoading,
  startDate,
  titleI18nKey,
  yLabelI18nKey,
}: Props) {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const [t] = useTranslation(['activity']);

  const visibleMonths = useVisibleMonthsTicks();
  const chartData = useChartData(dataPoints, dayjs(startDate), visibleMonths);

  if (isLoading) {
    return <Skeleton height="100%" variant="rectangular" />;
  }

  const isEmpty = chartData.every((point) => point.y === null);

  return (
    <MonthlyStatsProvider
      dateLineI18nKey={dateLineI18nKey}
      dateLineLabelYOffset={dateLineLabelYOffset}
      startDate={startDate}
    >
      <section>
        <Text variant="bodyS">{t(titleI18nKey)}</Text>

        <div className="flex items-center mt-sds-l">
          {isEmpty ? (
            <EmptyState className="flex-auto h-[70px] screen-495:h-[120px]">
              <I18n i18nKey={emptyI18nKey} />
            </EmptyState>
          ) : (
            <AreaChart
              data={chartData}
              fill={fill}
              yLabel={t(yLabelI18nKey) as string}
              // height defines aspect ratio of the chart:
              // https://formidable.com/open-source/victory/guides/layout/#default-layout
              height={isScreen600 ? 238 : 180}
              lineComponents={[LineTooltip, DateLine]}
              xTicks={visibleMonths}
            />
          )}
        </div>
      </section>
    </MonthlyStatsProvider>
  );
}
