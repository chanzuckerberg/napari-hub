import clsx from 'clsx';
import { ReactNode } from 'react-markdown';

import { Link } from '@/components/common';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';

import styles from './MetadataList.module.scss';
import { MetadataItem, MetadataValueTypes } from './PluginDetails.types';

interface CommonProps {
  /**
   * Renders the metadata list with headings and values inline.
   */
  inline?: boolean;
}

interface MetadataListItemProps extends CommonProps {
  /**
   * Title of the current metadata.
   */
  title: string;

  /**
   * List of values for the current metadata.
   */
  values: MetadataValueTypes[];
}

/**
 * Component for rendering a metadata list item.  This renders the title
 * heading and metadata value.
 */
function MetadataListItem({ inline, title, values }: MetadataListItemProps) {
  const { plugin } = usePluginState();
  const plausible = usePlausible();
  const isEmpty = values.filter(Boolean).length === 0;

  return (
    <li className="mb-4 text-sm">
      <h4
        className={clsx(
          // Inline styles
          inline ? 'inline mr-2' : 'block',

          // Font
          'font-bold whitespace-nowrap',
        )}
      >
        {title}:
      </h4>

      {/* Render placeholder for empty data.  */}
      {isEmpty && (
        <p
          className={clsx(
            'text-gray-400 font-normal',
            inline ? 'inline' : 'block',
          )}
        >
          information not submitted
        </p>
      )}

      {!isEmpty && (
        // Render metadata values as list
        <ul className={clsx('list-none', inline ? 'inline' : 'block')}>
          {values.map((value) => {
            let node: ReactNode;
            let key: string;

            if (typeof value === 'string') {
              key = value;
              node = value;
            } else {
              // If metadata value is link, render icon and anchor tag.
              key = `${value.text}-${value.href}`;
              node = (
                <span
                  className={clsx(
                    inline ? 'inline-flex' : 'flex',
                    'items-center',
                  )}
                >
                  {value.icon}

                  <Link
                    className="ml-2 underline"
                    href={value.href}
                    newTab
                    onClick={() => {
                      const url = new URL(value.href);
                      plausible('Links', {
                        host: url.host,
                        link: value.text,
                        plugin: plugin.name,
                        url: value.href,
                      });
                    }}
                  >
                    {value.text}
                  </Link>
                </span>
              );
            }

            return (
              <li
                className={clsx(
                  // Margins
                  'my-2 last:mb-0',

                  // Line height
                  'leading-8',

                  // Render as comma list if inline
                  // https://markheath.net/post/css-comma-separated-list
                  inline && ['inline', styles.commaList],
                )}
                key={key}
              >
                {node}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

interface MetadataListProps extends CommonProps {
  /**
   * Class name to pass to root component.
   */
  className?: string;

  /**
   * Renders the metadata list horizontally.
   */
  horizontal?: boolean;

  /**
   * List of values for the current metadata.
   */
  items: MetadataItem[];
}

/**
 * Component for rendering a list of plugin metadata titles and values.
 */
export function MetadataList({
  className,
  horizontal,
  inline,
  items,
}: MetadataListProps) {
  return (
    <ul
      className={clsx(className, 'list-none', horizontal && 'grid grid-cols-3')}
    >
      {items.map((item) => {
        const values = item.value instanceof Array ? item.value : [item.value];

        return (
          <MetadataListItem
            key={`${item.title}-${String(values)}`}
            inline={inline}
            title={item.title}
            values={values}
          />
        );
      })}
    </ul>
  );
}
