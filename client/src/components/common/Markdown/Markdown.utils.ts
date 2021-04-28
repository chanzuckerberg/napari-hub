import slug from 'rehype-slug';
import html from 'rehype-stringify';
import markdownParser from 'remark-parse';
import remark2rehype from 'remark-rehype';
import unified from 'unified';

import { HeadingNode, MarkdownHeader, MarkdownNode } from './Markdown.types';

/**
 * Plugins for transforming markdown to HTML. This also adds slug IDs to each
 * heading for linking in the TOC.
 */
const UNIFIED_PLUGINS = [
  // Parse markdown
  markdownParser,

  // Convert markdown to HTML for rehype parsing
  remark2rehype,

  // Add slug IDs to every heading
  slug,

  // Compile to HTML
  html,
];

/**
 * Header tag to use for TOC.
 */
export const TOC_HEADER_TAG = 'h2';

/**
 * Function for extracting TOC headers from a markdown string.  This uses
 * unified, remark, and rehype to parse the markdown string.  The string is
 * parsed synchronously so that rendering the headers work in SSR.  This is
 * also the same approach react-markdown uses:
 *
 * https://git.io/JObhE
 *
 * @param markdown Markdown string.
 * @returns Array of MarkdownHeader objects.
 */
export function getHeadersFromMarkdown(markdown: string): MarkdownHeader[] {
  if (!markdown) {
    return [];
  }

  // Create markdown processor with remark / rehype plugins.
  const processor = UNIFIED_PLUGINS.reduce(
    (currentProcessor, plugin) => currentProcessor.use(plugin),
    unified(),
  );

  // Create AST from markdown + plugins.
  const { children } = processor.runSync(
    processor.parse(markdown),
  ) as MarkdownNode;

  // Convert all H2 headings into MarkdownHeader objects.
  return children
    .filter((node): node is HeadingNode => node.tagName === TOC_HEADER_TAG)
    .map<MarkdownHeader>((node) => ({
      id: node.properties.id,
      text: node.children[0].value,
    }));
}
