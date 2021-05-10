import { Link } from '@/components/common';
import { PluginIndexData } from '@/types';

interface Props {
  plugin: PluginIndexData;
}

/**
 * Component for rendering a plugin search result.
 */
export function SearchResult({ plugin }: Props) {
  return (
    <article className="py-5 border-t-2 border-black" key={plugin.name}>
      {/* Plugin name */}
      <h3
        className="inline font-bold text-lg hover:underline"
        data-testid="searchResultName"
      >
        <Link href={`/plugins/${plugin.name}`}>{plugin.name}</Link>
      </h3>

      {/* Plugin summary */}
      <h4 className="mt-2" data-testid="searchResultSummary">
        {plugin.summary}
      </h4>

      {/* Plugin authors */}
      <ul className="mt-5">
        {plugin.authors.map((author) => (
          <li
            className="my-2"
            key={author.name}
            data-testid="searchResultAuthor"
          >
            <span className="font-bold">{author.name} </span>
            {author.email && `(${author.email})`}
          </li>
        ))}
      </ul>
    </article>
  );
}
