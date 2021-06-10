import { GitHub } from '@/components/common/icons';
import { LinkInfo } from '@/types';

export const LINKS: Record<string, LinkInfo> = {
  HOME: {
    title: 'Home',
    link: '/',
  },
  ABOUT: {
    title: 'About',
    link: '/about',
  },
  FAQ: {
    title: 'FAQ',
    link: '/faq',
  },
  PRIVACY: {
    title: 'Privacy policy',
    link: '/privacy',
  },
  CONTACT: {
    title: 'Contact',
    link: '/contact',
  },
  HUB_REPO: {
    title: 'GitHub repo',
    link: 'https://github.com/chanzuckerberg/napari-hub',
    newTab: true,
    icon: GitHub,
  },
};
