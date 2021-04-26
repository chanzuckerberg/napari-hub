import clsx from 'clsx';

import { useActiveHeader } from './Markdown.hooks';
import { getHeadersFromMarkdown } from './Markdown.utils';

interface Props {
  className?: string;
  markdown: string;
}

/**
 * Component for rendering TOC from a markdown string.  The TOC will generate
 * links to different headings in the markdown.  When clicking on the link, the
 * page should scroll to the heading and update the current active heading.
 *
 * For this to work, there needs to be a corresponding `<Markdown />` component
 * somewhere with the same markdown content.
 */
export function MarkdownTOC({ className, markdown }: Props) {
  const headers = getHeadersFromMarkdown(markdown);
  const activeHeader = useActiveHeader(headers);

  return (
    <ul className={clsx(className, 'flex flex-col', 'border-l border-black')}>
      {headers.map((header) => {
        const isActive = header.id === activeHeader;

        return (
          <li
            className={clsx(
              // Layout
              'flex',

              // Box model
              'pl-6 h-7 border-l-4',

              // Smooth transition for border color
              'transition-colors',

              'hover:border-napari-primary',
              !isActive && 'border-transparent',
              isActive && 'border-black',
            )}
            key={header.id}
            data-active={isActive}
            data-testid="tocItem"
          >
            {/*
              Use normal link component instead of Next.js Link because we're
              not loading another page.
            */}
            <a className={clsx(isActive && 'font-bold')} href={`#${header.id}`}>
              {header.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
