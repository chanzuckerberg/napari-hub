import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';

import { MenuDrawer, SearchBar } from '@/components';
import { ColumnLayout, Link } from '@/components/common';
import { MediaFragment } from '@/components/common/media';
import { MenuDrawerItem } from '@/components/MenuDrawer/types';
import { useSearchState } from '@/context/search';

const IMAGE_SIZE = 16;

const MENU_ITEMS: MenuDrawerItem[] = [
  {
    title: 'About',
    link: '/about',
  },
  {
    title: 'FAQ',
    link: '/faq',
  },
];

/**
 * Link bar for rendering menu links. This only shows up on lg+ screens.
 */
function AppBarLinks() {
  return (
    <>
      {MENU_ITEMS.map((item) => (
        <Link className="ml-6" key={item.link} href={item.link}>
          {item.title}
        </Link>
      ))}
    </>
  );
}

/**
 * Header that links back to the home page.
 */
function AppBarHeader() {
  const { setQuery } = useSearchState() ?? {};

  return (
    <header data-testid="appBarHeader" className="flex">
      <h1 className="whitespace-nowrap">
        <Link
          // Redirect to home page
          href="/"
          // Clear search related query parameter data if the user is currently
          // on the search page. Without this, the `useQueryParameter()` hook
          // will re-set the query parameter with the current query in the
          // search bar.
          onClick={() => setQuery?.('')}
        >
          napari <strong>hub</strong>
        </Link>
      </h1>

      <MediaFragment greaterThanOrEqual="lg">
        <AppBarLinks />
      </MediaFragment>
    </header>
  );
}

/**
 * App bar component that renders the home link, search bar, and menu.
 */
export function AppBar() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <MenuDrawer
        items={MENU_ITEMS}
        onMenuClose={() => setVisible(false)}
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

          // Grid layout for smaller screens
          'grid-cols-[min-content,1fr]',
        )}
        component="nav"
      >
        <AppBarHeader />

        <div
          className={clsx(
            // Flex layout
            'flex items-center',

            // Take 100% of width, but limit to center column width.
            'w-full max-w-napari-center-col',

            // Align container to the right of the grid cell
            'justify-self-end',
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
            <Image
              src="/icons/menu.svg"
              alt="Menu button icon"
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
            />
          </button>
        </div>
      </ColumnLayout>
    </>
  );
}
