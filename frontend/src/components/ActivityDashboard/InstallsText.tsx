import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'next-i18next';

import { useFormattedNumber } from '@/hooks';

interface Props {
  installs?: number;
  isLoading?: boolean;
}

export function InstallsText({ installs = 0, isLoading }: Props) {
  const { t } = useTranslation(['activity']);
  const formattedInstalls = useFormattedNumber(installs);

  return (
    <span className="!font-medium inline-flex items-center mr-2">
      {isLoading ? <Skeleton className="mr-2" width={32} /> : formattedInstalls}{' '}
      {t('activity:installs', { count: installs })}
    </span>
  );
}
