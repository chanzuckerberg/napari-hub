import clsx from 'clsx';
import ReactMarkdown, { TransformOptions } from 'react-markdown';
import slug from 'rehype-slug';
import gfm from 'remark-gfm';
import removeComments from 'remark-remove-comments';

import styles from './Markdown.module.scss';
import { MarkdownCode } from './MarkdownCode';
import { MarkdownTOC } from './MarkdownTOC';

interface Props {
  // Markdown code.
  children: string;

  // Disable H1 headers when rendering markdown.
  disableHeader?: boolean;
}

const REMARK_PLUGINS = [
  // Add support for GitHub style markdown like checkboxes.
  gfm,

  // Remove HTML comments from markdown.
  removeComments,
];

const REHYPE_PLUGINS = [
  // Add slug IDs to every heading.
  slug,
];

/**
 * Component for rendering Markdown consistently in napari hub.
 */
export function Markdown({ children, disableHeader }: Props) {
  const components: TransformOptions['components'] = {
    code: MarkdownCode,
  };

  if (disableHeader) {
    components.h1 = () => null;
  }

  return (
    <ReactMarkdown
      className={clsx(
        styles.markdown,

        /*
          Use Tailwind prose for reasonable defaults on markdown styling. In
          the future, we can fine tune the CSS by hand for each markdown
          element.
        */
        'prose',

        // Disable max-width set by prose
        'max-w-none',
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
