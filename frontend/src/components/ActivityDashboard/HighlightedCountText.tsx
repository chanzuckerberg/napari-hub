import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'next-i18next';

import { useFormattedNumber } from '@/hooks';
import { I18nKeys } from '@/types/i18n';

interface Props {
  count?: number;
  isLoading?: boolean;
  i18nKey: I18nKeys<'activity'>;
}

export function HighlightedCountText({ count = 0, isLoading, i18nKey }: Props) {
  const { t } = useTranslation(['activity']);
  const formattedInstalls = useFormattedNumber(count);

  return (
    <span className="!font-medium inline-flex items-center mr-2">
      <>
        {isLoading ? (
          <Skeleton className="mr-2" width={32} />
        ) : (
          formattedInstalls
        )}{' '}
        {t(i18nKey, { count })}
      </>
    </span>
  );
}
