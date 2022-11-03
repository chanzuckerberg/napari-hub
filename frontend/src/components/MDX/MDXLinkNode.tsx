import { get } from 'lodash';
import { AnchorHTMLAttributes } from 'react';

import { Link } from '@/components/Link';
import { useLinks } from '@/hooks/useLinks';
import { LinkInfo } from '@/types';

interface MDXLinkNodeProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  newTab?: boolean;
}

/**
 * Helper component that renders link nodes for the MDX renderer. If the
 * component uses a special hub link key, it will automatically be filled with
 * data defined in `hooks/useLinks.ts`
 *
 * Hub links can be used by defining a markdown link using a key surrounded by
 * curly braces to represent a hub link:
 *
 * ```md
 * [link to the faq]({FAQ})
 * ```
 */
export function MDXLinkNode({ href, ...props }: MDXLinkNodeProps) {
  const links = useLinks();

  let newHref = decodeURI(href ?? '');
  const match = /\{([\w]*)\}/.exec(newHref);
  if (match) {
    // If the link node's `href` matches a specific hub link key, then replace the
    // `href` with the hub link.
    const linkKey = match[1];
    const linkInfo = get(links, linkKey) as LinkInfo;

    newHref = linkInfo.link;
  }

  return <Link {...props} href={newHref} />;
}
