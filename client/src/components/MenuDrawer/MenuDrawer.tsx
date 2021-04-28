import clsx from 'clsx';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';
import { useClickAway } from 'react-use';

import { Link, Overlay } from '@/components/common';

import styles from './MenuDrawer.module.scss';
import { MenuDrawerItem } from './types';

interface Props {
  items: MenuDrawerItem[];
  onMenuClose: () => void;
  visible: boolean;
}

const CLOSE_ICON_SIZE = 16;

/**
 * Navigation drawer that slides out from the right. An overlay is rendered
 * below the menu to emphasize the drawer being in view.
 *
 * The drawer closes automatically if the user clicks outside of the drawer.
 * This is handled using the `useClickAway()` hook:
 * https://git.io/JOmWl
 */
export function MenuDrawer({ items, onMenuClose, visible }: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  useClickAway(menuRef, onMenuClose);

  return (
    <>
      <Overlay visible={visible} />

      <motion.div
        data-testid="menu"
        animate={visible ? 'visible' : 'hidden'}
        initial="hidden"
        variants={{
          hidden: { x: '100%' },
          visible: { x: 0 },
        }}
        transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
        className={clsx(
          // Fixed positioning to keep entire menu in viewport
          'fixed top-0 right-0',

          // Layout
          'flex flex-row items-start',

          // High z-index so that drawer overlays everything on the website
          'z-40',

          // Dimensions
          'w-9/12 h-screen',

          // Padding
          'p-6',

          // Color
          'bg-black',
        )}
        ref={menuRef}
      >
        {/* Menu links */}
        <ul className="flex flex-auto flex-col">
          {items.map((item) => (
            <li
              className={clsx('text-white', styles.item)}
              data-testid="drawerItem"
              key={item.title}
            >
              <Link href={item.link} onClick={onMenuClose}>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>

        {/* Close button */}
        <button
          className="flex"
          data-testid="drawerClose"
          onClick={onMenuClose}
          type="button"
        >
          <Image
            src="/icons/close.svg"
            alt="Menu close button"
            layout="fixed"
            width={CLOSE_ICON_SIZE}
            height={CLOSE_ICON_SIZE}
          />
        </button>
      </motion.div>
    </>
  );
}
