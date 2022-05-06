import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

import { ColumnLayout } from '@/components/ColumnLayout';
import { Hub } from '@/components/icons';
import { Media, MediaFragment } from '@/components/media';

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
        'list-disc font-semibold space-y-4',
        styles.list,
        className,
      )}
    >
      {children}
    </ul>
  );
}

/**
 * Component that renders the landing page variant of the AppBar.
 */
export function AppBarLanding() {
  const links = useAppBarLinks();
  const [t] = useTranslation(['homePage']);

  // On smaller layouts, the last list item is rendered below the icon and 2
  // preceding list items. To achieve this affect, the last list item is
  // rendered in a separate list so that it can be rendered below everything.
  const lastListNode = <li>{t('homePage:appBar.share')}</li>;

  return (
    <ColumnLayout
      className="bg-napari-primary p-6 screen-495:p-12"
      classes={{
        // Use 3-column layout instead of 4-column.
        fourColumn: 'screen-1150:grid-cols-napari-3',
        gap: 'gap-x-6 md:gap-x-12',
      }}
      component="header"
    >
      <Media greaterThanOrEqual="screen-1425">
        <AppBarLinks items={links} vertical />
      </Media>

      <Media lessThan="screen-1425">
        <AppBarLinks className="mb-6" items={links} />
      </Media>

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
          'gap-6 screen-655:gap-12',
          'col-span-2 screen-875:col-span-3',
          'screen-1425:col-start-2',
          'items-center',
        )}
      >
        <Hub className={styles.logo} />

        <List className="ml-7">
          <li>{t('homePage:appBar.discover')}</li>
          <li>{t('homePage:appBar.learnHow')}</li>

          {/* Render in list if screen is wide enough. */}
          <MediaFragment greaterThanOrEqual="screen-725">
            {lastListNode}
          </MediaFragment>
        </List>
      </div>

      {/* Render as separate list so that it renders below everything on smaller screens. */}
      <MediaFragment lessThan="screen-725">
        <List className="col-span-2 px-6 mt-4">{lastListNode}</List>
      </MediaFragment>
    </ColumnLayout>
  );
}
