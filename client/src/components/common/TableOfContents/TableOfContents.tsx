import clsx from 'clsx';

import { useActiveHeader } from './TableOfContents.hooks';
import { TOCHeader } from './TableOfContents.types';

interface Props {
  /**
   * className: additional classes to apply to this component
   */
  className?: string;

  /**
   * onClick: callback for when headings are clicked.
   */
  onClick?(heading: string): void;

  /**
   * headers: header ids and titles to link to
   */
  headers: TOCHeader[];

  /**
   * free: whether the component should move with the page or be fixed in place
   */
  free?: boolean;
}

/**
 * Component for rendering TOC from the given headers. Highlighting will
 * only work if the headers match those present on the page.
 */
export function TableOfContents({ className, onClick, headers, free }: Props) {
  const activeHeader = useActiveHeader(headers);

  return (
    <ul
      className={clsx(
        className,
        'flex flex-col',
        'border-l border-black',
        !free && 'fixed',
      )}
    >
      {headers.map((header) => {
        const isActive = header.id === activeHeader;

        return (
          <li
            className={clsx(
              // Layout
              'flex',
              // 'flex items-center',

              // Box model
              'pl-6 h-6 border-l-4',

              // Apply top/bottom margins except for first/last items
              'my-2 first:mt-0 last:mb-0',

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
            <a
              className={clsx(isActive && 'font-bold')}
              href={`#${header.id}`}
              onClick={() => onClick?.(header.text)}
            >
              {header.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
