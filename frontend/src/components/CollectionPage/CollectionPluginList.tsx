import clsx from 'clsx';

import { Link } from '../Link';
import { useCollection } from './context';

export function CollectionPluginList() {
  const collection = useCollection();

  return (
    <ul
      className={clsx(
        'pt-6 screen-495:pt-[35px]',
        'col-span-2 screen-875:col-span-3',
        'screen-1150:col-start-2',
      )}
    >
      {collection.plugins.map((plugin) => (
        <li
          className={clsx(
            'py-5 hover:bg-napari-hover-gray',
            'border-black border-t-2 last:border-b-2',
          )}
          key={plugin.name}
        >
          <Link
            className={clsx(
              'grid gap-x-12 grid-cols-2',
              'screen-875:grid-cols-3',
              'screen-1150:grid-cols-napari-3',
            )}
            href={`/plugins/${plugin.name}`}
          >
            <h3
              className={clsx(
                'font-semibold text-[14px] screen-495:text-[17px]',
                'col-span-2 screen-600:col-span-1',
                'screen-875:col-span-2',
              )}
            >
              {plugin.display_name || plugin.name}
            </h3>
            <span
              className={clsx(
                'text-[9px] screen-495:text-[11px]',
                'col-span-2 screen-600:col-span-1 screen-600:row-start-2',
                'screen-875:col-span-2',
              )}
            >
              {plugin.name}
            </span>
            <p
              className={clsx(
                'mt-1 text-[11px] screen-495:text-[14px]',
                'col-span-2 screen-600:col-span-1 screen-600:row-start-3',
                'screen-875:col-span-2',
              )}
            >
              {plugin.summary}
            </p>

            <p
              className={clsx(
                'font-semibold !my-2',
                'col-span-2 screen-600:col-span-1 screen-600:row-start-4',
                'screen-875:col-span-2',
              )}
            >
              {plugin.authors.map((author) => author.name).join(', ')}
            </p>

            {plugin.comment && (
              <p
                className={clsx(
                  'italic text-[11px] screen-495:text-[14px]',
                  'col-span-2 screen-600:col-span-1',
                  'screen-600:col-start-2 screen-600:row-start-1 screen-600:row-span-5',
                  'screen-875:col-start-3',
                )}
              >
                {plugin.comment}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
