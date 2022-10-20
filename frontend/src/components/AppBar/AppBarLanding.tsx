import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

import { ColumnLayout } from '@/components/ColumnLayout';
import { Hub } from '@/components/icons';

import styles from './AppBarLanding.module.scss';
import { AppBarLinks } from './AppBarLinks';
import { useAppBarLinks } from './useAppBarLinks';

interface ListProps {
  children: ReactNode;
  className?: string;
}

function List({ children, className }: ListProps) {
  return (
    <ul
      className={clsx(
        'list-disc font-semibold space-y-sds-l',
        styles.list,
        className,
      )}
    >
      {children}
    </ul>
  );
}

/**
 * Component that renders the landing page variant of the AppBar.  On smaller
 * layouts, the last list item is rendered below the icon and 2 preceding list
 * items. To achieve this affect, the last list item is rendered in a separate
 * list so that it can be rendered below everything.
 */
export function AppBarLanding() {
  const links = useAppBarLinks();
  const [t] = useTranslation(['homePage']);

  return (
    <ColumnLayout
      className="bg-hub-primary-400 p-sds-xl screen-495:p-12"
      classes={{
        // Use 3-column layout instead of 4-column.
        fourColumn: 'screen-1150:grid-cols-napari-3',
        gap: 'gap-x-sds-xl screen-495:gap-x-12',
      }}
      component="header"
    >
      <div className="hidden screen-1425:block">
        <AppBarLinks items={links} vertical />
      </div>

      <div className="screen-1425:hidden">
        <AppBarLinks className="mb-6" items={links} />
      </div>

      <h1
        className={clsx(
          'font-bold col-span-full',
          'mb-6 screen-495:mb-12',
          'screen-1425:col-start-2 screen-1425:col-span-3',
          styles.heading,
        )}
      >
        {t('homePage:appBar.title')}
      </h1>

      <div
        className={clsx(
          'grid grid-cols-[min-content,1fr]',
          'gap-sds-xl  screen-655:gap-12',
          'col-span-2 screen-875:col-span-3',
          'screen-1425:col-start-2',
          'items-center',
        )}
      >
        <Hub className={styles.logo} />

        <List className="ml-sds-xl">
          <li>{t('homePage:appBar.discover')}</li>
          <li>{t('homePage:appBar.learnHow')}</li>

          {/* Render in list if screen is wide enough. */}
          <li className="hidden screen-725:block">
            {t('homePage:appBar.share')}
          </li>
        </List>
      </div>

      {/* Render as separate list so that it renders below everything on smaller screens. */}
      <div className="col-span-2 screen-725:hidden">
        <List className="px-sds-xl mt-sds-l">
          <li>{t('homePage:appBar.share')}</li>
        </List>
      </div>
    </ColumnLayout>
  );
}
