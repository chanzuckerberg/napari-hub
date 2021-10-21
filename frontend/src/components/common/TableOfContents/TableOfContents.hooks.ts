import { throttle } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

import { TOCHeader } from './TableOfContents.types';

/**
 * The designs requires a 35px margin between the heading and the top of the
 * viewport when scrolling to a heading, so the next heading should be
 * highlighted when hitting that offset.
 */
const TOP_OFFSET_PX = 35;

/**
 * Duration of throttling for  `findActiveHeader()` function. This is so that
 * the `findActiveHeader()` function is called no more than 100ms so that we can
 * reduce expensive calls to `getBoundingClientRect()`.
 */
const FIND_ACTIVE_HEADER_THROTTLE_MS = 100;

/**
 * Duration to wait for before setting the active header on initial load.
 */
const SET_INITIAL_HEADER_TIMEOUT_MS = 200;

/**
 * Utility function for finding the first header in the viewport by looking for
 * the first positive `top` value.
 *
 * TODO Look into using IntersectionObserver API: https://mzl.la/3lYJvpt
 *
 * @param headers The markdown headers.
 * @returns Data for the first header in the viewport.
 */
function firstHeaderInViewport(headers: TOCHeader[]) {
  // Find first header that is in viewport.
  let firstHeaderTop = 0;
  let firstHeaderIndex = -1;

  for (let i = 0; i < headers.length; i += 1) {
    const { id } = headers[i];
    const node = document.getElementById(id);
    const top = node?.getBoundingClientRect()?.top ?? 0;

    if (top >= 0) {
      firstHeaderTop = top;
      firstHeaderIndex = i;
      break;
    }
  }

  const firstHeader = headers[firstHeaderIndex] as TOCHeader | undefined;

  return {
    firstHeader,
    firstHeaderTop,
    firstHeaderIndex,
  };
}

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
export function useActiveHeader(headers: TOCHeader[]) {
  const [activeHeader, setActiveHeader] = useState(headers[0]?.id ?? '');

  // Function that finds the active header based on the current viewport `scrollY`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findActiveHeader = useCallback(
    throttle(() => {
      const { firstHeader, firstHeaderIndex, firstHeaderTop } =
        firstHeaderInViewport(headers);

      if (!firstHeader) {
        return;
      }

      if (Math.floor(firstHeaderTop) <= TOP_OFFSET_PX) {
        setActiveHeader(firstHeader.id);
      } else {
        // If the first header in the viewport is greater than the offset, then the
        // user is still in the previous section.
        const previousHeader = headers[firstHeaderIndex - 1] ?? firstHeader;
        setActiveHeader(previousHeader.id);
      }
    }, FIND_ACTIVE_HEADER_THROTTLE_MS),
    [headers],
  );

  const enableEventHandlers = useCallback(() => {
    document.addEventListener('scroll', findActiveHeader);
    document.addEventListener('resize', findActiveHeader);
  }, [findActiveHeader]);

  const disableEventHandlers = useCallback(() => {
    document.removeEventListener('scroll', findActiveHeader);
    document.removeEventListener('resize', findActiveHeader);
  }, [findActiveHeader]);

  // Effect for determining the active header on initial load. For some reason,
  // this effect doesn't work on Safari because of some weird hash link issue.
  // When opening a URL like https://napari-hub.org/plugins/example#license,
  // Safari will sometimes open the page several pixels above the `License`
  // header.
  //
  // The same issue can be seen on GitHub when opening a hash link in Safari:
  // https://docs.github.com/en/actions/creating-actions/about-actions#creating-a-readme-file-for-your-action
  // TODO Look into fix for Safari.
  useEffect(() => {
    const initialHeader = window.location.hash.replace(/^#/, '');

    // If the user is opening a link with a header specified in the hash, then
    // we need to figure out the correct active header to render.
    if (headers.find((header) => header.id === initialHeader)) {
      // Wrap in timeout so that the DOM has time to settle after initial load.
      setTimeout(() => {
        // If the header is at the bottom of the page, then set the active
        // header to whatever was specified in the URL hash.
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
          setActiveHeader(initialHeader);
        } else {
          // If the page is loaded anywhere else, then just find the next active
          // header in the viewport.
          findActiveHeader();
        }

        enableEventHandlers();
      }, SET_INITIAL_HEADER_TIMEOUT_MS);
    } else {
      // If there is no header specified in the hash, then just find the next
      // active header in the viewport.
      findActiveHeader();
      enableEventHandlers();
    }

    return disableEventHandlers;
  }, [disableEventHandlers, enableEventHandlers, findActiveHeader, headers]);

  return {
    activeHeader,
    setActiveHeader,
    enableEventHandlers,
    disableEventHandlers,
  };
}
