import clsx from 'clsx';

import { Link } from '@/components/common';
import { useSearchState } from '@/context/search';
import { AppLink } from '@/types';

interface CommonProps {
  vertical?: boolean;
}

interface LinkListProps extends CommonProps {
  items: AppLink[];
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
  items?: AppLink[];
}

/**
 * Component that includes site-wide navigational links.
 */
export function AppBarLinks({ className, items, vertical }: Props) {
  const { setQuery } = useSearchState() ?? {};

  return (
    <nav className={clsx(className, 'flex', vertical && 'flex-col')}>
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

      {items && <LinkList items={items} vertical={vertical} />}
    </nav>
  );
}
