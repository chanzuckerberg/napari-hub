import { useEffect, useState } from 'react';

import { MarkdownHeader } from './Markdown.types';

/**
 * The designs requires a 35px margin between the heading and the top of the
 * viewport when scrolling to a heading, so the next heading should be
 * highlighted when hitting that offset.
 */
const TOP_OFFSET = 35;

/**
 * Hook for getting the selected heading anchor from an array of markdown
 * headers.  The headers should be rendered on the DOM via the <Markdown />
 * component for this to work.
 *
 * This code is inspired by the TOC for Docusaurus: https://git.io/JObbd, with
 * small improvements.
 *
 * @param headers Markdown headers from `getHeadersFromMarkdown()`
 * @returns Active header ID
 */
export function useActiveHeader(headers: MarkdownHeader[]): string {
  const [active, setActive] = useState(headers[0]?.id ?? '');

  useEffect(() => {
    function findActiveHeader() {
      // Get headers as DOM nodes.
      const headerTags = headers.map((header) =>
        document.getElementById(header.id),
      );

      // Find first header that is in viewport.
      const firstHeaderIndex = headerTags.findIndex((header) => {
        const top = header?.getBoundingClientRect()?.top ?? 0;
        return top >= 0;
      });
      const firstHeader = headerTags[firstHeaderIndex];

      if (firstHeader) {
        const { top } = firstHeader.getBoundingClientRect();

        // If user reaches the bottom, set the last header as selected.
        if (
          window.innerHeight + window.pageYOffset >=
          document.body.scrollHeight
        ) {
          setActive(headers[headers.length - 1].id);
        } else if (Math.floor(top) <= TOP_OFFSET) {
          setActive(firstHeader.id);
        } else {
          /*
            If the first header in viewport is greater than the offset, then
            the user is still in the previous section.
          */
          const previousHeader = headers[firstHeaderIndex - 1] ?? firstHeader;
          setActive(previousHeader.id);
        }
      }
    }

    document.addEventListener('scroll', findActiveHeader);
    document.addEventListener('resize', findActiveHeader);

    // Find active header on initial render
    findActiveHeader();

    // Remove event listeners on cleanup.
    return () => {
      document.removeEventListener('scroll', findActiveHeader);
      document.removeEventListener('resize', findActiveHeader);
    };
  }, [headers]);

  return active;
}
