import Tooltip from '@material-ui/core/Tooltip';
import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@/components/Link';
import { MetadataStatus } from '@/components/MetadataStatus';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';
import { isExternalUrl } from '@/utils/url';

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
          inline ? 'inline mr-2' : 'block mb-2',

          // Font
          'font-bold whitespace-nowrap',

          // Preview orange overlay
          isEmpty && 'bg-napari-preview-orange-overlay',
        )}
      >
        {title}:
      </h4>

      <ul className={clsx('list-none space-y-5', inline ? 'inline' : 'block')}>
        {isEmpty && (
          <li
            // Preview orange overlay if isValueEmpty is true
            className={clsx(
              'text-napari-gray font-normal bg-napari-preview-orange-overlay flex justify-between items-center',
              inline ? 'inline' : 'block leading-8',
            )}
          >
            information not submitted
            <Tooltip placement="right" title="MetadataStatus Text Placeholder">
              <div>
                <MetadataStatus hasValue={false} />
              </div>
            </Tooltip>
          </li>
        )}

        {!isEmpty &&
          values.map((value) => {
            let node: ReactNode;
            let key: string;

            let isValueEmpty = false;

            if (typeof value === 'string') {
              key = value;
              node = value;
              isValueEmpty = !value;
            } else {
              // If metadata value is link, render icon and anchor tag.
              key = `${value.text}-${value.href}`;
              const hasLink = !!value.href;
              isValueEmpty = !hasLink;

              const icon = (!hasLink && value.missingIcon) || value.icon;
              const iconNode = icon && <span className="min-w-4">{icon}</span>;

              const internalLink = !isExternalUrl(value.href);

              const linkNode = hasLink && (
                <>
                  {iconNode}

                  <Link
                    className="ml-2 underline inline -mt-1"
                    href={value.href}
                    newTab={!internalLink}
                    onClick={
                      internalLink
                        ? undefined
                        : () => {
                            const url = new URL(value.href);

                            if (plugin?.name) {
                              plausible('Links', {
                                host: url.host,
                                link: value.text,
                                plugin: plugin.name,
                                url: value.href,
                              });
                            }
                          }
                    }
                  >
                    {value.text}
                  </Link>
                </>
              );

              const emptyLinkNode = !hasLink && (
                <>
                  {iconNode}

                  <Tooltip placement="right" title="Information not submitted">
                    <span className="ml-2 cursor-not-allowed -mt-1">
                      {value.text}
                    </span>
                  </Tooltip>
                </>
              );

              node = (
                <span
                  className={clsx(
                    inline ? 'inline-flex' : 'flex',
                    !value.href && 'text-napari-gray',
                  )}
                >
                  {linkNode}
                  {emptyLinkNode}
                </span>
              );
            }

            return (
              <li
                className={clsx(
                  // Line height
                  'leading-normal',

                  // Render as comma list if inline
                  // https://markheath.net/post/css-comma-separated-list
                  inline && ['inline', styles.commaList],

                  // Preview orange overlay if isValueEmpty is true
                  isValueEmpty &&
                    'bg-napari-preview-orange-overlay flex justify-between items-center',
                )}
                key={key}
              >
                {node}
                {isValueEmpty && (
                  <Tooltip
                    placement="right"
                    title="MetadataStatus Text Placeholder"
                  >
                    <div>
                      <MetadataStatus hasValue={false} />
                    </div>
                  </Tooltip>
                )}
              </li>
            );
          })}
      </ul>
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
