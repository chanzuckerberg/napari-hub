import clsx from 'clsx';

import { Media } from '@/components/common/media';

import { MetadataItem } from './PluginDetails.types';

interface MetadataListItemProps {
  title: string;
  values: string[];
}

/**
 * Component for rendering a metadata list item.  This renders the title
 * heading and metadata value.
 */
function MetadataListItem({ title, values }: MetadataListItemProps) {
  const isEmpty = values.filter(Boolean).length === 0;

  return (
    <li className="mb-4 text-sm">
      <h4
        className={clsx(
          /*
            Render inline on smaller layouts, then render as block to move
            list to next line.
          */
          'inline 3xl:block',

          // Font
          'font-bold whitespace-nowrap',

          // Margins
          'mr-2 3xl:m-0',
        )}
      >
        {title}:
      </h4>

      {isEmpty && (
        <p className="text-gray-400 font-normal inline 3xl:block">
          information not submitted
        </p>
      )}

      <Media lessThan="3xl">
        {(className, render) =>
          render && (
            <p className={clsx(className, 'inline')}>{values.join(', ')}</p>
          )
        }
      </Media>

      <Media greaterThanOrEqual="3xl">
        {(className, render) =>
          render && (
            <ul className={clsx(className, 'list-none')}>
              {values.map((value) => (
                <li className="my-2 last:mb-0" key={value}>
                  {value}
                </li>
              ))}
            </ul>
          )
        }
      </Media>
    </li>
  );
}

interface MetadataListProps {
  items: MetadataItem[];
}

/**
 * Component for rendering a list of plugin metadata titles and values.
 */
export function MetadataList({ items }: MetadataListProps) {
  return (
    <ul className="list-none">
      {items.map((item) => {
        const values = item.value instanceof Array ? item.value : [item.value];

        return (
          <MetadataListItem
            key={`${item.title}-${String(values)}`}
            title={item.title}
            values={values}
          />
        );
      })}
    </ul>
  );
}
