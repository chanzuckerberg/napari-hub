import { useMemo } from 'react';
import { useMedia } from 'react-use';

import { breakpoints } from '@/theme';

type BreakpointKey = keyof typeof breakpoints;
type Breakpoint = number | BreakpointKey;

interface UseMediaQueryOption {
  minWidth?: Breakpoint;
  maxWidth?: Breakpoint;
  between?: [Breakpoint, Breakpoint];
  around?: [Breakpoint, Breakpoint];
}

const BREAKPOINT_KEY_SET = new Set(Object.keys(breakpoints));

function isBreakpointKey(breakpoint: Breakpoint): breakpoint is BreakpointKey {
  return typeof breakpoint !== 'number' && BREAKPOINT_KEY_SET.has(breakpoint);
}

function formatBreakpoint(breakpoint: Breakpoint): string {
  if (typeof breakpoint === 'number') {
    return `${breakpoint}px`;
  }

  if (isBreakpointKey(breakpoint)) {
    const value = breakpoints[breakpoint];
    return `${value}px`;
  }

  return breakpoint;
}

/**
 * Determines if the viewport satisfies the specified media query. Media query
 * values can either be a number (in pixels), a string value (number + units),
 * or a napari-hub breakpoint key.
 */
export function useMediaQuery({
  minWidth,
  maxWidth,
  between,
  around,
}: UseMediaQueryOption): boolean {
  const query = useMemo(() => {
    if (minWidth) {
      return `(min-width: ${formatBreakpoint(minWidth)})`;
    }

    if (maxWidth) {
      return `(max-width: ${formatBreakpoint(maxWidth)})`;
    }

    if (between) {
      const [left, right] = between.map(formatBreakpoint);
      return `(min-width: ${left}) and (max-width: ${right})`;
    }

    if (around) {
      const [left, right] = around.map(formatBreakpoint);
      return `(max-width: ${left}), (min-width: ${right})`;
    }

    return '';
  }, [around, between, maxWidth, minWidth]);

  return useMedia(query);
}
