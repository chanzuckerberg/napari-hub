import { get } from 'lodash';

import { Link, Props as LinkProps } from '@/components/Link';
import { useLinks } from '@/hooks/useLinks';
import { LinkInfo } from '@/types';
import { isExternalUrl } from '@/utils';

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
export function MDXLinkNode({ href, ...props }: LinkProps) {
  const links = useLinks();

  let newHref = decodeURI(href ?? '');
  let newTab = false;
  const match = /\{([\w]*)\}/.exec(newHref);
  if (match) {
    // If the link node's `href` matches a specific hub link key, then replace the
    // `href` with the hub link.
    const linkKey = match[1];
    const linkInfo = get(links, linkKey) as LinkInfo;

    newHref = linkInfo.link;
    newTab = !!linkInfo.newTab;
  } else if (href) {
    newTab = isExternalUrl(href);
  }

  return <Link {...props} newTab={newTab} href={newHref} />;
}
