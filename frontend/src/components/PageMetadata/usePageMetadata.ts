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

interface PageMetadata {
  keywords: string[];
  description: string;
}

export function usePageMetadata(pathname: string): PageMetadata | undefined {
  const [t] = useTranslation(['common']);

  const pageMetadata = {
    about: {
      regex: /^\/about$/,
      keywords: [...COMMON_KEYWORDS, 'about'],
      description: t('common:htmlMeta.about.description'),
    },

    contact: {
      regex: /^\/contact$/,
      keywords: [...COMMON_KEYWORDS, 'contact'],
      description: t('common:htmlMeta.contact.description'),
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
      ],
      description: t('common:htmlMeta.faq.description'),
    },

    privacy: {
      regex: /^\/privacy$/,
      keywords: [...COMMON_KEYWORDS, 'privacy'],
      description: t('common:htmlMeta.privacy.description'),
    },

    plugin: {
      regex: /^\/plugins\/.*$/,
      keywords: [...COMMON_KEYWORDS],
      description: '',
    },

    collections: {
      regex: /^\/collections$/,
      keywords: [...COMMON_KEYWORDS, 'collections'],
      description: t('common:htmlMeta.collections.description'),
    },

    collection: {
      regex: /^\/collections\/.*$/,
      keywords: [...COMMON_KEYWORDS, 'collections'],
      description: '',
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
      ],
      description: t('common:htmlMeta.home.description'),
    },
  };

  return Object.values(pageMetadata).find(({ regex }) => regex.exec(pathname));
}
