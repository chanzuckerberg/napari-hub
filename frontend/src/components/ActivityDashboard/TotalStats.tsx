import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text';
import { useDateBucketType } from '@/hooks';
import { I18nKeys } from '@/types/i18n';

import { FormattedDuration } from './FormattedDuration';
import { HighlightedCountText } from './HighlightedCountText';

enum DateBucketType {
  LessThanAWeek,
  OverAWeek,
  OverNWeeks,
  OverNMonths,
  OverNYears,
}

interface Props {
  count?: number;
  date?: dayjs.ConfigType;
  countI18nKey: I18nKeys<'activity'>;
  infoI18nKey: I18nKeys<'activity'>;
  isLoading?: boolean;
}

export function TotalStats({
  count,
  countI18nKey,
  date: dateStr,
  infoI18nKey,
  isLoading,
}: Props) {
  const { t } = useTranslation(['activity']);
  const date = useMemo(() => dayjs(dateStr), [dateStr]);
  const dateBucketType = useDateBucketType(date);

  return (
    <Text className="font-light" element="p" variant="h2">
      <HighlightedCountText
        count={count}
        isLoading={isLoading}
        i18nKey={countI18nKey}
      />

      <span className="mr-2">
        <>
          {t(infoI18nKey)}{' '}
          {t(
            dateBucketType === DateBucketType.LessThanAWeek
              ? 'activity:duration.lessThan'
              : 'activity:duration.over',
          )}
        </>
      </span>

      <FormattedDuration date={date} isLoading={isLoading} />
    </Text>
  );
}
