/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AreaChart } from '@/components/AreaChart';
import { DataPoint } from '@/types/stats';

import { I18n } from '../I18n';

export interface Props {
  data: DataPoint[];
  showRawData?: boolean;
  installCount: number;
  installMonthCount: number;
}

export function ActivityDashboard({
  data,
  showRawData,
  installCount,
  installMonthCount,
}: Props) {
  const { t, i18n } = useTranslation(['activity']);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        notation: 'compact',
      }),
    [i18n.language],
  );

  if (data.length === 0) {
    return <p>No data for this plugin :(</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-[600px,600px] gap-y-6">
        <div className="col-span-2">
          <h5 className="font-bold text-[20px] leading-[27px]">
            {t('activity:installs.title')}
          </h5>

          <p className="text-[17px] leading-[25.5px] mt-10">
            <I18n
              i18nKey="activity:installs.installCount"
              values={{
                installs: formatter.format(installCount),
                months: formatter.format(installMonthCount),
              }}
              components={{
                count: <span className="text-[51px] leading-[25.5px]" />,
              }}
            />
          </p>
        </div>

        <AreaChart data={data} yLabel="Installs" timeseries />
      </div>

      {showRawData && (
        <pre>
          <code>
            {JSON.stringify(
              {
                installCount,
                installMonthCount,
                data,
              },
              null,
              2,
            )}
          </code>
        </pre>
      )}
    </div>
  );
}
