import clsx from 'clsx';

import { Link } from '@/components/Link';
import { Text } from '@/components/Text';

import { useCollection } from './context';

const MAX_COMMENT_LENGTH = 100;

export function CollectionPluginList() {
  const collection = useCollection();

  return (
    <ul
      className={clsx(
        'pt-sds-xl screen-495:pt-sds-xxl',
        'col-span-2 screen-875:col-span-3',
        'screen-1150:col-start-2',
      )}
    >
      {collection.plugins.map((plugin) => {
        const renderedComment = plugin.comment
          ?.substring(0, MAX_COMMENT_LENGTH)
          .trim();
        return (
          <li
            className={clsx(
              'py-sds-xl hover:bg-hub-gray-100',
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
              <h2
                className={clsx(
                  'leading-[161%] screen-495:leading-[132%] ',
                  'font-semibold text-[14px] screen-495:text-[17px]',
                  'col-span-2 screen-600:col-span-1',
                  'screen-875:col-span-2',
                )}
              >
                {plugin.display_name || plugin.name}
              </h2>

              <Text
                className={clsx(
                  'col-span-2 screen-600:col-span-1 screen-600:row-start-2',
                  'screen-875:col-span-2',
                )}
                element="span"
                variant="bodyXS"
              >
                {plugin.name}
              </Text>

              <Text
                className={clsx(
                  'mt-sds-l',
                  'col-span-2 screen-600:col-span-1 screen-600:row-start-3',
                  'screen-875:col-span-2',
                )}
                variant="bodyS"
              >
                {plugin.summary}
              </Text>

              <Text
                weight="semibold"
                className={clsx(
                  'mt-sds-l mb-sds-xl',
                  'col-span-2 screen-600:col-span-1 screen-600:row-start-4',
                  'screen-875:col-span-2',
                )}
                variant="bodyXS"
              >
                {plugin.authors.map((author) => author.name).join(', ')}
              </Text>

              {renderedComment && (
                <Text
                  className={clsx(
                    'col-span-2 screen-600:col-span-1',
                    'screen-600:col-start-2 screen-600:row-start-1 screen-600:row-span-5',
                    'screen-875:col-start-3',
                  )}
                  italic
                  variant="bodyS"
                >
                  {renderedComment}

                  {/*
                    Add ellipsis if comment is greater than max length and if it
                    doesn't end with a period.
                  */}
                  {(plugin.comment?.length ?? 0) > MAX_COMMENT_LENGTH &&
                    !renderedComment.endsWith('.') &&
                    '...'}
                </Text>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
