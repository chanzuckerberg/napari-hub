import Image from 'next/image';
import { ReactElement, useState } from 'react';

import { Link, MenuDrawer, SearchBar } from '@/components';
import { MenuDrawerItem } from '@/components/MenuDrawer/types';

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
  return (
    <header className={styles.header}>
      <h1>
        <Link href="/">
          napari <strong>hub</strong>
        </Link>
      </h1>
    </header>
  );
}

/**
 * Link bar for rendering menu links. This only shows up on (screen >= lg).
 */
function AppBarLinks() {
  return (
    <div className={styles.links}>
      {MENU_ITEMS.map((item) => (
        <Link key={item.link} href={item.link}>
          {item.title}
        </Link>
      ))}
    </div>
  );
}

/**
 * App bar component that renders the home link, search bar, and menu.
 */
export function AppBar(): ReactElement {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <MenuDrawer
        items={MENU_ITEMS}
        onMenuClose={() => setVisible(false)}
        visible={visible}
      />

      <nav className={styles.appBar}>
        <AppBarHeader />

        <div className={styles.searchContainer}>
          <SearchBar />
          <AppBarLinks />

          {/* Menu button */}
          <button
            className={styles.menuButton}
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
