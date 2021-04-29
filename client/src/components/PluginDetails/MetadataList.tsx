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
  return (
    <li className="mb-4 text-sm">
      <h4 className="font-bold">{title}:</h4>
      <ul className="list-none">
        {values.map((value) => (
          <li className="my-2" key={value}>
            {value}
          </li>
        ))}
      </ul>
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
