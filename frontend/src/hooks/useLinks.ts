import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import { LinkInfo } from '@/types';
import { isExternalUrl } from '@/utils';

/**
 * Helper function to restrict link data to the `LinkInfo` interface, while
 * maintaining the type information for every name created.
 */
function withLinkInfo<T extends Record<string, LinkInfo>>(
  locale: string,
  value: T,
) {
  if (locale !== 'en') {
    for (const linkInfo of Object.values(value)) {
      if (!isExternalUrl(linkInfo.link)) {
        linkInfo.link = `/${locale}${linkInfo.link}`;
      }
    }
  }

  return value as {
    [key in keyof T]: LinkInfo;
  };
}

export function useLinks() {
  const [t] = useTranslation(['common']);
  const router = useRouter();
  const locale = router.locale ?? 'en';

  return withLinkInfo(locale, {
    HOME: {
      title: t('common:home'),
      link: '/',
    },

    ABOUT: {
      title: t('common:about'),
      link: '/about',
    },

    FAQ: {
      title: t('common:faq'),
      link: '/faq',
    },

    PRIVACY: {
      title: t('common:privacy'),
      link: '/privacy',
    },

    CONTACT: {
      title: t('common:contact'),
      link: '/contact',
    },

    HUB_REPO: {
      title: t('common:githubRepo'),
      link: 'https://github.com/chanzuckerberg/napari-hub',
      newTab: true,
    },

    NAPARI_REPO: {
      title: t('common:githubRepo'),
      link: 'https://github.com/napari/napari',
      newTab: true,
    },
    NAPARI_WEBSITE: {
      title: t('common:napariMainWebsite'),
      link: 'https://napari.org',
      newTab: true,
    },
    NAPARI_GOVERNANCE: {
      title: t('common:napariGovernanceModel'),
      link: 'https://napari.org/community/governance.html',
      newTab: true,
    },
    IMAGESC: {
      title: t('common:napariImageScForum'),
      link: 'https://forum.image.sc/tag/napari',
      newTab: true,
    },
    PLAUSIBLE: {
      title: t('common:napariPlausible'),
      link: 'https://plausible.io/napari.dev',
      newTab: true,
    },
    PLAUSIBLE_PRIVACY: {
      title: t('common:plausiblePrivacy'),
      link: 'https://plausible.io/data-policy',
      newTab: true,
    },
    MAILCHIMP_PRIVACY: {
      title: t('common:mailchimpPrivacy'),
      link: 'https://mailchimp.com/legal/privacy/',
      newTab: true,
    },
    CZI_EOSS: {
      title: t('common:cziOss'),
      link: 'https://chanzuckerberg.com/eoss/',
      newTab: true,
    },
    PLUGINS: {
      title: t('common:plugins'),
      link: '/',
    },
    COLLECTIONS: {
      title: t('common:collections'),
      link: '/collections',
    },
  });
}
