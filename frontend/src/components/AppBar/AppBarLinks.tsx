import clsx from 'clsx';

import { Link } from '@/components/common';
import { searchFormStore } from '@/store/search/form.store';
import { LinkInfo } from '@/types';
import { setSearchScrollY } from '@/utils';

interface CommonProps {
  vertical?: boolean;
}

interface LinkListProps extends CommonProps {
  items: LinkInfo[];
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
        onClick={() => {
          // Clear search related query parameter data if the user is currently
          // on the search page. Without this, the `useQueryParameter()` hook
          // will re-set the query parameter with the current query in the
          // search bar.
          searchFormStore.search.query = '';

          // When navigating back to the home page from the home link, reset
          // `scrollY` so that the user starts from the top of the page.
          setSearchScrollY(0);
        }}
      >
        napari <strong>hub</strong>
      </Link>

      {items && <LinkList items={items} vertical={vertical} />}
    </nav>
  );
}
