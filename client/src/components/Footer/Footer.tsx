import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@/components/common';
import { CZI, GitHub, NapariLogo } from '@/components/common/icons';

import styles from './Footer.module.scss';

interface FooterLink {
  title: string;
  link: string;
  icon?: ReactNode;
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
        <Link className="whitespace-nowrap" key={item.link} href={item.link}>
          {item.icon && (
            <item.icon className="inline-block align-text-bottom mr-0.5 sm:mr-1 h-4 w-4" />
          )}
          {item.title}
        </Link>
      ))}
    </>
  );
}

/**
 * TODO: Update component description
 */
export function Footer() {
  return (
    <div className="flex flex-col gap-6 lg:gap-0 lg:flex-row bg-napari-primary p-6">
      <div className="w-full flex-1 flex flex-row justify-between lg:w-min lg:justify-start lg:gap-6">
        <FooterLinks />
      </div>
      <div className="flex flex-row justify-end gap-2">
        <Link href="https://napari.org">
          <NapariLogo className="w-8 h-8" />
        </Link>
        <div className="border-r-[1px] border-black" />
        <Link href="https://chanzuckerberg.com">
          <CZI className="w-8 h-8" />
        </Link>
      </div>
    </div>
  );
}
