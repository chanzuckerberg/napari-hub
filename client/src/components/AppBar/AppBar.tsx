import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';

import { MenuDrawer, SearchBar } from '@/components';
import { Link } from '@/components/common';
import { MenuDrawerItem } from '@/components/MenuDrawer/types';
import { useSearchState } from '@/context/search';

import styles from './AppBar.module.scss';

const IMAGE_SIZE = 16;

const MENU_ITEMS: MenuDrawerItem[] = [
  {
    title: 'About',
    link: '/about',
  },
  {
    title: 'Help',
    link: '/help',
  },
];

/**
 * Header that links back to the home page.
 */
function AppBarHeader() {
  const { setQuery } = useSearchState() ?? {};

  return (
    <header className="flex">
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
    </header>
  );
}

/**
 * Link bar for rendering menu links. This only shows up on lg+ screens.
 */
function AppBarLinks() {
  return (
    <ul
      className={clsx(
        // Hide links on smaller layouts
        'hidden lg:flex',

        // Margins
        'ml-12',

        // Custom link styling
        styles.links,
      )}
    >
      {MENU_ITEMS.map((item) => (
        <li className="list-none" key={item.link}>
          <Link href={item.link}>{item.title}</Link>
        </li>
      ))}
    </ul>
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

      <nav
        className={clsx(
          // Color and height
          'bg-napari-primary h-napari-app-bar',

          // Padding
          'px-6 md:px-12 2xl:p-0',

          // Grid layout
          'grid grid-cols-napari-nav-mobile',
          'justify-center items-center',

          // Grid gap
          'gap-6 md:gap-12',

          // Change to 2 column grid layout when 2xl+ screens
          '2xl:grid 2xl:grid-cols-napari-app-bar-2-col',

          // Use 3 column layout when 3xl+ screens
          '3xl:grid 3xl:grid-cols-napari-3-col',
        )}
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
          <AppBarLinks />

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
      </nav>
    </>
  );
}
