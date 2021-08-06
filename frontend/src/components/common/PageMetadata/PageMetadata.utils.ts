const COMMON_KEYWORDS = [
  'napari hub',
  'napari',
  'hub',
  'plugin',
  'image analysis',
  'imaging',
  'chan zuckerberg initiative',
];

const PAGE_METADATA = {
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
    description:
      'A site for napari plugins. Discover plugins that solve your image analysis ' +
      'challenges, learn how to install into napari, and share image analysis ' +
      'tools with napari’s growing community.',
  },

  about: {
    regex: /^\/about$/,
    keywords: [...COMMON_KEYWORDS, 'about'],
    description:
      'The napari hub is a service of the Chan Zuckerberg Initiative in ' +
      'collaboration with napari.\n' +
      'The napari hub seeks to solve many of the challenges and needs in finding ' +
      'analysis solutions to bioimaging problems.',
  },

  contact: {
    regex: /^\/contact$/,
    keywords: [...COMMON_KEYWORDS, 'contact'],
    description:
      'If you would like to contact the napari hub team, you can do so in a ' +
      'variety of ways. For help with or ideas for the napari hub, please check ' +
      'out the discussion board.',
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
    description:
      'We hope these questions will help you in your napari plugin journey! We ' +
      'endeavour to update this regularly. If you need additional information or ' +
      'assistance, check out the Contact page or you can reach a human at ' +
      'team@napari-hub.org.',
  },

  privacy: {
    regex: /^\/privacy$/,
    keywords: [...COMMON_KEYWORDS, 'privacy'],
    description: "Information about napari hub's website privacy notice.",
  },

  plugin: {
    regex: /^\/plugins\/.*$/,
    keywords: [...COMMON_KEYWORDS],
    description: '',
  },
};

interface PageMetadata {
  keywords: string[];
  description: string;
}

export function getPageMetadata(pathname: string): PageMetadata | null {
  let metadata: PageMetadata | null = null;

  Object.values(PAGE_METADATA).some(({ regex, ...currentMetadata }) => {
    if (regex.exec(pathname)) {
      metadata = currentMetadata;
    }

    return metadata;
  });

  return metadata;
}
