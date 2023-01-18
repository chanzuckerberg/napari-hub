import dayjs from 'dayjs';
import { createContext, ReactNode, useContext, useMemo } from 'react';

import { I18nKeys } from '@/types/i18n';

interface MonthlyStatsValue {
  dateLineI18nKey: I18nKeys<'activity'>;
  startDate: dayjs.ConfigType;
}

const MonthlyStatsContext = createContext<MonthlyStatsValue | null>(null);

interface Props
  extends Pick<MonthlyStatsValue, 'startDate' | 'dateLineI18nKey'> {
  children: ReactNode;
}

export function MonthlyStatsProvider({
  children,
  dateLineI18nKey,
  startDate,
}: Props) {
  const value = useMemo(
    () => ({
      dateLineI18nKey,
      startDate,
    }),
    [dateLineI18nKey, startDate],
  );

  return (
    <MonthlyStatsContext.Provider value={value}>
      {children}
    </MonthlyStatsContext.Provider>
  );
}

export function useMonthlyStats(): MonthlyStatsValue {
  const value = useContext(MonthlyStatsContext);

  if (!value) {
    throw new Error('useMonthlyStats() must be used in a MonthlyStatsProvider');
  }

  return value;
}
