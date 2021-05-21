import clsx from 'clsx';

import { Link } from '@/components/common';
import { PluginIndexData } from '@/types';
import { formatDate, formatOperatingSystem } from '@/utils';

interface Props {
  className?: string;
  plugin: PluginIndexData;
}

interface SearchResultItem {
  label: string;
  value: string;
}

/**
 * Component for rendering a plugin search result.
 */
export function PluginSearchResult({ className, plugin }: Props) {
  // TODO consolidate with PluginGithubData component in PluginMetadata.tsx
  const items: SearchResultItem[] = [
    {
      label: 'version',
      value: plugin.version,
    },
    {
      label: 'release date',
      value: formatDate(plugin.release_date),
    },
    {
      label: 'license',
      value: plugin.license,
    },
    {
      label: 'Python version',
      value: plugin.python_version,
    },
    {
      label: 'operating system',
      value: plugin.operating_system.map(formatOperatingSystem).join(', '),
    },
  ];

  return (
    <Link
      className={clsx(
        className,
        'py-5 border-t-2 border-black hover:bg-napari-hover-gray',
      )}
      href={`/plugins/${plugin.name}`}
    >
      <article
        data-testid="searchResult"
        className={clsx(
          'grid gap-x-6 md:gap-x-12',
          'screen-600:grid-cols-napari-2',
          'screen-1425:grid-cols-napari-3',
        )}
      >
        <div className="screen-1425:col-span-2 flex flex-col justify-between">
          {/* Wrapper div to group plugin name and summary  */}
          <div>
            {/* Plugin name */}
            <h4
              className="inline font-bold text-lg"
              data-testid="searchResultName"
            >
              {plugin.name}
            </h4>

            {/* Plugin summary */}
            <p className="mt-2" data-testid="searchResultSummary">
              {plugin.summary}
            </p>
          </div>

          {/* Plugin authors */}
          <ul className="mt-5 text-xs">
            {plugin.authors.map((author) => (
              <li
                className="my-2 font-bold"
                key={author.name}
                data-testid="searchResultAuthor"
              >
                {author.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Plugin metadata */}
        <ul className="mt-4 screen-600:m-0 space-y-1 text-sm">
          {items.map((item) => (
            <li
              key={`${item.label}-${item.value}`}
              className="grid grid-cols-[auto,1fr]"
            >
              <h5 className="inline whitespace-nowrap">{item.label}: </h5>
              <span className="font-bold ml-1">{item.value}</span>
            </li>
          ))}
        </ul>
      </article>
    </Link>
  );
}
