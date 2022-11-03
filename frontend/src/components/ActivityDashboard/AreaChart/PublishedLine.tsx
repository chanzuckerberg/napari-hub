import dayjs from 'dayjs';
import { useTranslation } from 'next-i18next';
import { VictoryLabel, VictoryLabelProps } from 'victory';

import { DataPoint } from '@/types/stats';

import { useAreaChartState } from './context';

export function PublishedLine(props: VictoryLabelProps) {
  const [t] = useTranslation(['activity']);
  const { publicReleaseX, isScreen600, visibleMonths } = useAreaChartState();
  const { x = 0, datum } = props;
  const point = datum as DataPoint;

  if (
    dayjs(publicReleaseX).isAfter(dayjs(visibleMonths.at(-1))) ||
    point.x !== publicReleaseX ||
    point.y === null
  ) {
    return null;
  }

  return (
    <g>
      <line
        transform={`translate(${x ?? 0}, 50)`}
        x1={0}
        y2={-20}
        y1={200}
        stroke="#000"
        strokeWidth={1}
        strokeDasharray={4}
      />

      <VictoryLabel
        {...props}
        x={x - 5}
        y={150}
        angle={-90}
        text={t('activity:monthlyInstalls.publicRelease')}
        style={{
          fontFamily: 'Barlow',
          fontSize: isScreen600 ? 18 : 11,
        }}
      />
    </g>
  );
}
