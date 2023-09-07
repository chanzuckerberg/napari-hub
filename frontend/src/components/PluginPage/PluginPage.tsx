import { throttle } from 'lodash';
import { useEffect } from 'react';

import { ColumnLayout } from '@/components/ColumnLayout';
import { useLoadingState } from '@/context/loading';

import { PluginCenterColumn } from './PluginCenterColumn';
import { PluginLeftColumn } from './PluginLeftColumn';
import { PluginRightColumn } from './PluginRightColumn';

const SCROLL_HANDLER_THROTTLE_MS = 200;

let userScrollY = 0;

const scrollHandler = throttle(() => {
  userScrollY = window.scrollY;
}, SCROLL_HANDLER_THROTTLE_MS);

/**
 * Component for rendering the plugin details page.
 */
export function PluginPage() {
  const loading = useLoadingState();

  useEffect(() => {
    if (loading) {
      window.scroll(0, 0);
      document.addEventListener('scroll', scrollHandler);
    } else {
      document.removeEventListener('scroll', scrollHandler);
      window.scroll(0, userScrollY);
      userScrollY = 0;
    }
  }, [loading]);

  return (
    <div className="flex flex-col flex-grow justify-center">
      <ColumnLayout
        className="p-sds-xl  screen-495:p-12 screen-875:px-0"
        data-testid="pluginDetails"
      >
        <PluginLeftColumn />
        {/*
        The markup for the right column is placed before the center column so
        that keyboard navigation focuses on the right column before the main
        column since the main column can be very long.

        A good example of this is implemented on the W3C site:
        https://www.w3.org/WAI/tutorials/menus/flyout. When tabbing through the
        site, it focuses on the table of contents before the main content.
      */}
        <PluginRightColumn />
        <PluginCenterColumn />
      </ColumnLayout>
    </div>
  );
}
