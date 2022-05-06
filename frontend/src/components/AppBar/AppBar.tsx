import IconButton from '@material-ui/core/IconButton';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useRef, useState } from 'react';

import { ColumnLayout } from '@/components/ColumnLayout';
import { Menu } from '@/components/icons';
import { Media } from '@/components/media';
import { MenuPopover } from '@/components/MenuPopover';
import { SearchBar } from '@/components/SearchBar';

import { AppBarLinks } from './AppBarLinks';
import { useAppBarLinks } from './useAppBarLinks';

/**
 * App bar component that renders the home link, search bar, and menu.
 */
export function AppBar() {
  const anchorElRef = useRef<HTMLButtonElement | null>(null);
  const [visible, setVisible] = useState(false);
  const links = useAppBarLinks();
  const [t] = useTranslation(['common']);

  return (
    <>
      <Media lessThan="screen-600">
        <MenuPopover
          anchorEl={anchorElRef.current}
          items={links}
          onClose={() => setVisible(false)}
          visible={visible}
        />
      </Media>

      <ColumnLayout
        className={clsx(
          // Color and height
          'bg-napari-primary h-napari-app-bar',

          // Centering
          'justify-center items-center',

          // Padding
          'px-6 screen-495:px-12 screen-1150:p-0',

          // Grid layout for smaller screens. This allows the search bar to
          // extend to its max width to the left. The `zero:` modifier is used
          // to increase specificity over ColumnLayout.
          'zero:grid-cols-[min-content,1fr]',
        )}
        component="header"
      >
        <Media greaterThanOrEqual="screen-600">
          <AppBarLinks items={links} />
        </Media>

        <Media lessThan="screen-600">
          <AppBarLinks />
        </Media>

        <div
          className={clsx(
            // Flex layout
            'flex items-center',

            // Take 100% of width.
            'w-full',

            // Align container to the right of the grid cell
            'justify-self-end',

            // Use more columns on larger screens
            'screen-875:col-span-2 screen-1150:col-span-3',
          )}
        >
          <SearchBar />

          {/* Menu button */}
          <Media className="ml-6 flex" lessThan="screen-600">
            <IconButton onClick={() => setVisible(true)} ref={anchorElRef}>
              <Menu alt={t('common:alt.sideMenu')} />
            </IconButton>
          </Media>
        </div>
      </ColumnLayout>
    </>
  );
}
