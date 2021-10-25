import clsx from 'clsx';

import { Link } from '@/components/common/Link';
import { resetLoadingState } from '@/store/loading';
import { resetState } from '@/store/search/form.store';
import { LinkInfo } from '@/types';

interface CommonProps {
  vertical?: boolean;
}

interface LinkListProps extends CommonProps {
  items: LinkInfo[];
}

function resetStateClickHandler() {
  // Reset states when opening app bar links.
  resetState();
  resetLoadingState();
}

/**
 * Link bar for rendering menu links. This only shows up on lg+ screens.
 */
function LinkList({ items, vertical }: LinkListProps) {
  return (
    <div className={clsx('flex', vertical && 'flex-col')}>
      {items.map((item) => (
        <Link
          className={clsx(vertical ? 'mt-4' : 'ml-6')}
          key={item.link}
          href={item.link}
          onClick={resetStateClickHandler}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}

interface Props extends CommonProps {
  className?: string;
  items?: LinkInfo[];
}

/**
 * Component that includes site-wide navigational links.
 */
export function AppBarLinks({ className, items, vertical }: Props) {
  return (
    <nav className={clsx(className, 'flex', vertical && 'flex-col')}>
      <Link
        data-testid="appBarHome"
        className="whitespace-nowrap"
        // Redirect to home page
        href="/"
        onClick={resetStateClickHandler}
      >
        napari <strong>hub</strong>
      </Link>

      {items && <LinkList items={items} vertical={vertical} />}
    </nav>
  );
}
