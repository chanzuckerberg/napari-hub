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
  NAPARI_GOVERNANCE: {
    title: 'napari governance model',
    link: 'https://napari.org/docs/dev/developers/GOVERNANCE.html',
    newTab: true,
  },
  CZI_EOSS: {
    title: 'Chan Zuckerberg Initiative EOSS Program',
    link: 'https://chanzuckerberg.com/eoss/',
    newTab: true,
  },
};
