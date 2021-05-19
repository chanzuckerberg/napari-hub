import clsx from 'clsx';

import { Link } from '@/components/common';
import { PluginIndexData } from '@/types';
import { formatDate } from '@/utils/date';

interface Props {
  className?: string;
  plugin: PluginIndexData;
}

interface SearchResultItem {
  label: string;
  value: string;
}

/**
 * Utility for formatting the list of operating systems as a comma list. This
 * also removes the nested classifiers so that only the OS name is rendered.
 *
 * @param operatingSystems List of operating systems classifiers.
 * @returns The operating system formatted as a comma list.
 */
function formatOperatingSystem(operatingSystems: string[]): string {
  return operatingSystems
    .map((os) => {
      // Return last part of OS trove classifier. The nesting on pypi is
      // arbitrary, so you can have a long string like "Operating Systems ::
      // Microsoft :: Windows :: Windows 10", or a short string like "Operating
      // Systems :: OS Independent".
      const parts = os.split(' :: ');
      const name = parts[parts.length - 1];

      return name.replace('OS Independent', 'All');
    })
    .join(', ');
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
      value: formatOperatingSystem(plugin.operating_system),
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
            <h3
              className="inline font-bold text-lg"
              data-testid="searchResultName"
            >
              {plugin.name}
            </h3>

            {/* Plugin summary */}
            <p className="mt-2" data-testid="searchResultSummary">
              {plugin.summary}
            </p>
          </div>

          {/* Plugin authors */}
          <ul className="mt-5">
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
        <ul className="mt-4 space-y-1">
          {items.map((item) => (
            <li
              key={`${item.label}-${item.value}`}
              className="grid grid-cols-[auto,1fr]"
            >
              <h4 className="inline whitespace-nowrap">{item.label}: </h4>
              <span className="font-bold ml-1">{item.value}</span>
            </li>
          ))}
        </ul>
      </article>
    </Link>
  );
}
