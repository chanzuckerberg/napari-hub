import { ComponentType } from 'react';

import { Link } from '@/components/common';
import { CZI, GitHub, IconProps, NapariLogo } from '@/components/common/icons';

interface FooterLink {
  title: string;
  link: string;
  newTab?: boolean;
  icon?: ComponentType<IconProps>;
}

const FOOTER_LINKS: FooterLink[] = [
  {
    title: 'About',
    link: '/about',
  },
  {
    title: 'FAQ',
    link: '/faq',
  },
  {
    title: 'Privacy policy',
    link: '/privacy',
  },
  {
    title: 'Contact',
    link: '/contact',
  },
  {
    title: 'GitHub repo',
    link: 'https://github.com/chanzuckerberg/napari-hub',
    newTab: true,
    icon: GitHub,
  },
];

/**
 * Link bar for footer links
 */
function FooterLinks() {
  return (
    <>
      {FOOTER_LINKS.map((item) => (
        <Link
          className="whitespace-nowrap flex flex-row items-center"
          key={item.link}
          href={item.link}
          newTab={item.newTab}
        >
          {item.icon && (
            <item.icon className="inline-block mr-0.5 sm:mr-1 h-4 w-4" />
          )}
          {item.title}
        </Link>
      ))}
    </>
  );
}

/**
 * Footer component has your footer links and icons
 */
export function Footer() {
  return (
    <div className="flex flex-col gap-6 lg:gap-0 lg:flex-row lg:items-center bg-napari-primary p-6 lg:pl-12">
      <div className="w-full h-8 flex-1 flex flex-row items-center gap-2 sm:gap-6 lg:w-min lg:justify-start">
        <FooterLinks />
      </div>
      <div className="flex flex-row justify-end gap-2">
        <Link href="https://napari.org" newTab>
          <NapariLogo className="w-8 h-8" />
        </Link>
        <div className="border-r-[1px] border-black" />
        <Link href="https://chanzuckerberg.com" newTab>
          <CZI className="w-8 h-8" />
        </Link>
      </div>
    </div>
  );
}
