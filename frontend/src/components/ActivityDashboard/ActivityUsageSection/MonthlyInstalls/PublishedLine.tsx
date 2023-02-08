import dayjs from 'dayjs';
import { useTranslation } from 'next-i18next';
import { VictoryLabel, VictoryLabelProps } from 'victory';

import { usePluginState } from '@/context/plugin';
import { useMediaQuery } from '@/hooks';
import { DataPoint } from '@/types/metrics';

export function PublishedLine(props: VictoryLabelProps) {
  const [t] = useTranslation(['activity']);
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const { plugin } = usePluginState();
  const { x = 0, datum } = props;
  const point = datum as DataPoint;
  const release = dayjs(plugin?.first_released);

  if (
    point.y === null ||
    // render label if current point and release are the same month
    !dayjs(point.x).isSame(dayjs(release), 'month') ||
    // don't render label if it's on the first point in the area chart
    release.isSame(dayjs().subtract(1, 'year'), 'month')
  ) {
    return null;
  }

  return (
    <g>
      <line
        transform={`translate(${x ?? 0}, 50)`}
        x1={0}
        y2={-40}
        y1={isScreen600 ? 140 : 80}
        stroke="#000"
        strokeWidth={1}
        strokeDasharray={4}
      />

      <VictoryLabel
        {...props}
        x={x}
        y={isScreen600 ? 110 : 80}
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
