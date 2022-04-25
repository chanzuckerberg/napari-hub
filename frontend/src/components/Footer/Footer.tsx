import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ComponentType } from 'react';

import { I18n } from '@/components/I18n';
import { CZI, GitHub, NapariLogo } from '@/components/icons';
import { IconProps } from '@/components/icons/icons.type';
import { Link } from '@/components/Link';
import { useLinks } from '@/hooks/useLinks';
import { LinkInfo } from '@/types';

interface FooterItem extends LinkInfo {
  /**
   * Icon associated with the link.
   */
  icon?: ComponentType<IconProps>;
}

function useFooterItems(): FooterItem[] {
  const links = useLinks();

  return [
    links.ABOUT,
    links.FAQ,
    links.PRIVACY,
    links.CONTACT,
    { ...links.HUB_REPO, icon: GitHub },
  ];
}

/**
 * Link bar for footer links
 */
function FooterLinks() {
  const items = useFooterItems();

  return (
    <>
      {items.map((item) => (
        <Link
          className={clsx(
            // font style
            'whitespace-nowrap font-semibold text-sm',
            // alignment if icon present
            item.icon && 'flex flex-row items-center',
            // spacing (TODO: replace with flex-gap once iOS 14.6 is old)
            'mr-6 last:mr-0',
          )}
          key={item.link}
          href={item.link}
          newTab={item.newTab}
        >
          {item.icon && <item.icon className="inline-block mr-0.5 h-3 w-3" />}
          {item.title}
        </Link>
      ))}
    </>
  );
}

/**
 * Footer component has your footer links and icons
 *
 * We use margin instead of flex gap because
 * iOS Safari <14.6 does not support it
 *
 * TODO: revert to using flex wrap + flex gap when iOS 14.6 isn't so new
 */
export function Footer() {
  const [t] = useTranslation(['footer']);

  return (
    <div
      className={clsx(
        // layout
        'grid grid-cols-2',
        'screen-655:grid-cols-[1fr,min-content]',
        'screen-1150:grid-cols-[1fr,max-content,min-content]',
        'gap-4',

        // color
        'bg-napari-primary',

        // spacing
        'p-6 screen-495:px-12',
      )}
    >
      <div
        className={clsx(
          // sizing
          'w-full flex-1',
          // layout
          'flex flex-row items-center justify-start',
          // spacing
          'mb-6 screen-655:mb-0 screen-655:mr-12',
        )}
      >
        <FooterLinks />
      </div>

      <span
        className={clsx(
          'text-xs row-start-2 col-span-2',
          'justify-self-end self-center',
          'screen-655:col-span-1 screen-655:whitespace-nowrap',
          'screen-1150:row-start-1 screen-1150:col-start-2',
        )}
      >
        <I18n i18nKey="footer:napariHubCollab" />
      </span>

      <div
        className={clsx(
          'flex flex-row justify-end',
          'row-start-3 col-start-2',
          'screen-655:row-start-2 screen-655:col-start-2',
          'screen-1150:row-start-1 screen-1150:col-start-3',
        )}
      >
        <Link href="https://napari.org" className="mr-2" newTab>
          <NapariLogo
            className="w-[1.625rem] h-[1.625rem] screen-495:w-[2.375rem] screen-495:h-[2.375rem]"
            alt={t('footer:alt.goToNapari')}
          />
        </Link>

        <div className="border-r-[1px] border-black" />

        <Link href="https://chanzuckerberg.com" className="ml-2" newTab>
          <CZI
            className="w-[3.3125rem] h-[1.625rem] screen-495:w-[4.625rem] screen-495:h-[2.375rem]"
            variant="large"
          />
        </Link>
      </div>
    </div>
  );
}
