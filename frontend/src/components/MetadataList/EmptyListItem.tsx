import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

/**
 * Renders a special list item informing the user that the metadata has no
 * supplied value.
 */
export function EmptyListItem({ children }: Props) {
  const [t] = useTranslation(['common']);

  return (
    <li className={clsx('flex justify-between items-center')}>
      <span className="text-napari-gray font-normal lowercase">
        {t('common:infoNotSubmitted')}
      </span>

      {children}
    </li>
  );
}
