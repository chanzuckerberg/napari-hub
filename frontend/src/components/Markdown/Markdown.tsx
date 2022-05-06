import clsx from 'clsx';
import schema from 'hast-util-sanitize/lib/github.json';
import ReactMarkdown, { PluggableList, TransformOptions } from 'react-markdown';
import raw from 'rehype-raw';
import sanitize from 'rehype-sanitize';
import slug from 'rehype-slug';
import externalLinks from 'remark-external-links';
import gfm from 'remark-gfm';
import removeComments from 'remark-remove-comments';

import styles from './Markdown.module.scss';
import { MarkdownCode } from './MarkdownCode';
import { MarkdownParagraph } from './MarkdownParagraph';
import { MarkdownTOC } from './MarkdownTOC';

interface Props {
  // Optional CSS class for markdown component.
  className?: string;

  // Markdown code.
  children: string;

  // Disable H1 headers when rendering markdown.
  disableHeader?: boolean;

  // Render markdown with placeholder styles.
  placeholder?: boolean;
}

const REMARK_PLUGINS: PluggableList = [
  // Add support for GitHub style markdown like checkboxes.
  gfm,

  // Remove HTML comments from markdown.
  removeComments,

  [externalLinks, { target: '_blank', rel: 'noreferrer' }],
];

const REHYPE_PLUGINS: PluggableList = [
  // Parse inner HTML
  raw,

  // Sanitize inner HTML
  [
    sanitize,
    {
      ...schema,
      attributes: {
        ...schema.attributes,
        // Enable class names for code blocks
        code: ['className'],
      },
    },
  ],

  // Add slug IDs to every heading.
  slug,
];

/**
 * Component for rendering Markdown consistently in napari hub.
 */
export function Markdown({
  className,
  children,
  disableHeader,
  placeholder,
}: Props) {
  const components: TransformOptions['components'] = {
    code: MarkdownCode,
    p: MarkdownParagraph,
  };

  if (disableHeader) {
    components.h1 = () => null;
  }

  return (
    <ReactMarkdown
      className={clsx(
        className,
        styles.markdown,
        placeholder && styles.placeholder,
      )}
      components={components}
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
    >
      {children}
    </ReactMarkdown>
  );
}

Markdown.TOC = MarkdownTOC;
