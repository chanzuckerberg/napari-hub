import clsx from 'clsx';
import { useState } from 'react';

import { ColumnLayout } from '@/components/common/ColumnLayout';
import { Menu } from '@/components/common/icons';
import { Media } from '@/components/common/media';
import { MenuDrawer } from '@/components/MenuDrawer';
import { SearchBar } from '@/components/SearchBar';

import { APP_LINKS } from './AppBar.constants';
import { AppBarLinks } from './AppBarLinks';

/**
 * App bar component that renders the home link, search bar, and menu.
 */
export function AppBar() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <MenuDrawer
        items={APP_LINKS}
        onClose={() => setVisible(false)}
        onOpen={() => setVisible(true)}
        visible={visible}
      />

      <ColumnLayout
        className={clsx(
          // Color and height
          'bg-napari-primary h-napari-app-bar',

          // Centering
          'justify-center items-center',

          // Padding
          'px-6 md:px-12 2xl:p-0',

          // Grid layout for smaller screens. This allows the search bar to
          // extend to its max width to the left. The `zero:` modifier is used
          // to increase specificity over ColumnLayout.
          'zero:grid-cols-[min-content,1fr]',
        )}
        component="header"
      >
        <Media greaterThanOrEqual="lg">
          <AppBarLinks items={APP_LINKS} />
        </Media>

        <Media lessThan="lg">
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
            'xl:col-span-2 2xl:col-span-3',
          )}
        >
          <SearchBar />

          {/* Menu button */}
          <button
            // Show menu button on smaller layouts
            className="ml-6 flex lg:hidden"
            onClick={() => setVisible(true)}
            type="button"
          >
            <Menu alt="Icon for opening side menu." />
          </button>
        </div>
      </ColumnLayout>
    </>
  );
}
