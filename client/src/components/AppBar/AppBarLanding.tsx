import clsx from 'clsx';
import { ReactNode } from 'react-markdown';

import { ColumnLayout } from '@/components/common';
import { Hub } from '@/components/common/icons';

import { Media, MediaFragment } from '../common/media';
import { APP_LINKS } from './AppBar.constants';
import styles from './AppBarLanding.module.scss';
import { AppBarLinks } from './AppBarLinks';

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
  // On smaller layouts, the last list item is rendered below the icon and 2
  // preceding list items. To achieve this affect, the last list item is
  // rendered in a separate list so that it can be rendered below everything.
  const lastListNode = (
    <li>Share your image analysis tools with napari’s growing community</li>
  );

  return (
    <ColumnLayout
      className="bg-napari-primary p-6 screen-495:p-12"
      classes={{
        // Use 3-column layout instead of 4-column.
        fourColumn: 'screen-1150:grid-cols-napari-3',
      }}
      component="header"
    >
      <Media greaterThanOrEqual="screen-1425">
        <AppBarLinks items={APP_LINKS} vertical />
      </Media>

      <Media lessThan="screen-1425">
        <AppBarLinks className="mb-6" items={APP_LINKS} />
      </Media>

      <h1
        className={clsx(
          'font-bold col-span-full',
          '-mt-12 screen-1425:m-0',
          'screen-1425:col-start-2 screen-1425:col-span-3',
          styles.heading,
        )}
      >
        Discover, install, and share napari plugins
      </h1>

      <Hub
        className={clsx(
          'self-center justify-self-end',
          'screen-1425:row-start-2 screen-1425:col-start-2',
          styles.logo,
        )}
      />

      <List className="ml-6 screen-875:col-span-2">
        <li>Discover plugins that solve your image analysis challenges</li>
        <li>Install into napari straight from your browser</li>

        {/* Render in list if screen is wide enough. */}
        <MediaFragment greaterThanOrEqual="screen-725">
          {lastListNode}
        </MediaFragment>
      </List>

      {/* Render as separate list so that it renders below everything on smaller screens. */}
      <MediaFragment lessThan="screen-725">
        <List className="col-span-2 px-6">{lastListNode}</List>
      </MediaFragment>
    </ColumnLayout>
  );
}
