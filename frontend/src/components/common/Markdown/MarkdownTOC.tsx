import {
  TableOfContents,
  TOCHeader,
} from '@/components/common/TableOfContents';
import {
  ANCHOR,
  TITLE,
} from '@/components/PluginDetails/CitationInfo.constants';

import { getHeadersFromMarkdown } from './Markdown.utils';

interface Props {
  className?: string;
  onClick?(heading: string): void;
  markdown: string;
  hasCitationInfo?: boolean;
  free?: boolean;
}

const CITATION_HEADER: TOCHeader = {
  id: ANCHOR,
  text: TITLE,
};

/**
 * Component for rendering TOC from a markdown string.  The TOC will generate
 * links to different headings in the markdown.  When clicking on the link, the
 * page should scroll to the heading and update the current active heading.
 *
 * For this to work, there needs to be a corresponding `<Markdown />` component
 * somewhere with the same markdown content.
 */
export function MarkdownTOC({
  className,
  markdown,
  hasCitationInfo,
  ...props
}: Props) {
  const headers = getHeadersFromMarkdown(markdown);

  if (hasCitationInfo) headers.push(CITATION_HEADER);

  return <TableOfContents className={className} headers={headers} {...props} />;
}
