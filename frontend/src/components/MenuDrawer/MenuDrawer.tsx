import { IconButton, SwipeableDrawer } from '@material-ui/core';

import { Close } from '@/components/common/icons';
import { Link } from '@/components/common/Link';
import { LinkInfo } from '@/types';

interface Props {
  items: LinkInfo[];
  onClose: () => void;
  onOpen: () => void;
  visible: boolean;
}

/**
 * Navigation drawer that slides out from the right. The drawer can be opened by
 * pressing the menu button or by swiping left from the right side of the
 * screen. Conversely, the drawer can be closed by clicking the close button,
 * swiping the drawer right, or clicking outside of the drawer area.
 */
export function MenuDrawer({ items, onOpen, onClose, visible }: Props) {
  return (
    <SwipeableDrawer
      anchor="right"
      classes={{ paper: 'bg-black flex-row w-9/12 p-6' }}
      onClose={onClose}
      onOpen={onOpen}
      open={visible}
      data-testid="menu"
    >
      <ul className="text-white flex-grow">
        {items.map((item) => (
          <li
            className="mb-5 last:m-0"
            key={item.title}
            data-testid="drawerItem"
          >
            <Link href={item.link} onClick={onClose}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>

      <IconButton
        className="self-start p-0"
        data-testid="drawerClose"
        onClick={onClose}
      >
        <Close />
      </IconButton>
    </SwipeableDrawer>
  );
}
