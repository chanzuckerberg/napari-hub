import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ComponentType } from 'react';

import { CZI, GitHub, NapariLogo } from '@/components/common/icons';
import { IconProps } from '@/components/common/icons/icons.type';
import { Link } from '@/components/common/Link';
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
        'flex flex-col screen-655:flex-row justify-items-center',
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

      <div className="flex flex-row flex-grow w-min justify-end self-end">
        <Link href="https://napari.org" className="mr-2" newTab>
          <NapariLogo className="w-8 h-8" alt={t('footer:alt.goToNapari')} />
        </Link>

        <div className="border-r-[1px] border-black" />

        <Link href="https://chanzuckerberg.com" className="ml-2" newTab>
          <CZI className="w-8 h-8" alt={t('footer:alt.goToCzi')} />
        </Link>
      </div>
    </div>
  );
}
