import dayjs from 'dayjs';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

import { Text } from '@/components/Text';
import { DateBucketType, useDateBucketType } from '@/hooks';
import { I18nKeys } from '@/types/i18n';

import { FormattedDuration } from './FormattedDuration';
import { HighlightedCountText } from './HighlightedCountText';

interface Props {
  count?: number;
  countI18nKey?: I18nKeys<'activity'>;
  date?: dayjs.ConfigType;
  durationI18nKey?: I18nKeys<'activity'>;
  infoI18nKey: I18nKeys<'activity'>;
  isLoading?: boolean;
}

export function RecentStats({
  count,
  countI18nKey,
  date,
  durationI18nKey,
  infoI18nKey,
  isLoading,
}: Props) {
  const { t } = useTranslation(['activity']);
  const dateBucketType = useDateBucketType(date);

  return (
    <Text className="font-light" element="p" variant="h2">
      {countI18nKey && (
        <HighlightedCountText
          count={count}
          i18nKey={countI18nKey}
          isLoading={isLoading}
        />
      )}

      <span className="mr-2">{t(infoI18nKey) as ReactNode}</span>

      {durationI18nKey && (
        <span className="!font-medium">{t(durationI18nKey) as ReactNode}</span>
      )}

      {date && !durationI18nKey && (
        <>
          {t(
            dateBucketType === DateBucketType.LessThanAWeek
              ? 'activity:duration.lessThan'
              : 'activity:duration.over',
          )}

          <FormattedDuration date={date} isLoading={isLoading} />
        </>
      )}
    </Text>
  );
}
