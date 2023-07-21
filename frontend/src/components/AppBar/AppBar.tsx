import clsx from 'clsx';
import { ButtonIcon } from 'czifui';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

import { Menu } from '@/components/icons';
import { MenuPopover } from '@/components/MenuPopover';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { pageTransitionsStore } from '@/store/pageTransitions';
import { createUrl } from '@/utils';

import { PluginSearchBar } from '../SearchBar/PluginSearchBar';
import { AppBarLinks } from './AppBarLinks';
import { useAppBarLinks } from './useAppBarLinks';

/**
 * App bar component that renders the home link, search bar, and menu.
 */
export function AppBar() {
  const anchorElRef = useRef<HTMLButtonElement | null>(null);
  const [visible, setVisible] = useState(false);
  const links = useAppBarLinks();
  const [t] = useTranslation(['common']);

  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');
  const router = useRouter();
  const { nextUrl } = useSnapshot(pageTransitionsStore);

  const isPluginsPage =
    router.pathname === '/plugins' ||
    createUrl(nextUrl).pathname === '/plugins';

  return (
    <>
      <div className="screen-600:hidden">
        <MenuPopover
          anchorEl={anchorElRef.current}
          items={links}
          onClose={() => setVisible(false)}
          visible={visible}
        />
      </div>

      <header
        className={clsx(
          'grid grid-cols-[min-content,1fr]',
          'screen-875:grid-cols-napari-3',
          'screen-1150:grid-cols-napari-4',
          'screen-1425:grid-cols-napari-5',
          'gap-sds-xl screen-495:gap-12',

          // Color and height
          'bg-hub-primary-400 h-napari-app-bar',

          // Centering
          'justify-center items-center',

          // Padding
          'px-sds-xl screen-495:px-12 screen-1150:p-0',
        )}
      >
        <div className="hidden screen-600:block">
          <AppBarLinks items={links} />
        </div>

        <div className="screen-600:hidden">
          <AppBarLinks />
        </div>

        <div
          className={clsx(
            // Flex layout
            'flex items-center',

            // Take 100% of width.
            'w-full',

            // Align container to the right of the grid cell
            'justify-end',

            // Use more columns on larger screens
            'screen-875:col-span-2 screen-1150:col-span-3',
          )}
        >
          {isHomePageRedesign && !isPluginsPage && <PluginSearchBar />}

          {/* Menu button */}
          <div
            className="ml-sds-xl flex screen-600:hidden"
            data-testid="mobileMenuButtonContainer"
          >
            <ButtonIcon
              className="p-2"
              onClick={() => setVisible(true)}
              ref={anchorElRef}
              size="large"
            >
              <Menu alt={t('common:alt.sideMenu')} />
            </ButtonIcon>
          </div>
        </div>
      </header>
    </>
  );
}
