import { useTranslation } from 'next-i18next';

const COMMON_KEYWORDS = [
  'napari hub',
  'napari',
  'hub',
  'plugin',
  'image analysis',
  'imaging',
  'chan zuckerberg initiative',
];

export interface PageMetadataProps {
  description?: string;
  image?: string;
  keywords?: string[];
  title?: string;
  twitterUser?: string;
  url?: string;
}

interface PageMetadataMatcher extends PageMetadataProps {
  regex: RegExp;
}

export function usePageMetadata(
  pathname: string,
): PageMetadataProps | undefined {
  const [t] = useTranslation(['common']);

  const pageMetadata: Record<string, PageMetadataMatcher> = {
    about: {
      regex: /^\/about$/,
      keywords: [...COMMON_KEYWORDS, 'about'],
      description: t('common:seo.about.description'),
      title: t('common:seo.about.title'),
    },

    contact: {
      regex: /^\/contact$/,
      keywords: [...COMMON_KEYWORDS, 'contact', 'help', 'issue', 'security'],
      description: t('common:seo.contact.description'),
      title: t('common:seo.contact.title'),
    },

    faq: {
      regex: /^\/faq$/,
      keywords: [
        ...COMMON_KEYWORDS,
        'workflow',
        'find',
        'python',
        'FAQ',
        'frequently asked questions',
        'question',
        'answer',
      ],
      description: t('common:seo.faq.description'),
      title: t('common:seo.faq.title'),
    },

    privacy: {
      regex: /^\/privacy$/,
      keywords: [
        ...COMMON_KEYWORDS,
        'privacy',
        'personal',
        'data',
        'website',
        'policy',
      ],
      description: t('common:seo.privacy.description'),
      title: t('common:seo.privacy.title'),
    },

    plugin: {
      regex: /^\/plugins\/.*$/,
      keywords: [...COMMON_KEYWORDS],
    },

    collections: {
      regex: /^\/collections$/,
      keywords: [...COMMON_KEYWORDS, 'collections', 'search'],
      description: t('common:seo.collections.description'),
      title: t('common:seo.collections.title'),
    },

    collection: {
      regex: /^\/collections\/.*$/,
      keywords: [
        ...COMMON_KEYWORDS,
        'collections',
        'find',
        'curated',
        'community',
      ],
    },

    home: {
      regex: /^\/$/,
      keywords: [
        ...COMMON_KEYWORDS,
        'workflow',
        'find',
        'python',
        'pypi',
        'algorithm',
        'search',
      ],
      description: t('common:seo.home.description'),
      title: t('common:seo.home.title'),
    },
  };

  return Object.values(pageMetadata).find(({ regex }) => regex.exec(pathname));
}
