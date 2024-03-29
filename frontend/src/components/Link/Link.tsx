import NextLink from 'next/link';
import { AnchorHTMLAttributes, ComponentProps, forwardRef } from 'react';
import { Optional } from 'utility-types';

type LinkProps = ComponentProps<typeof NextLink>;

export type Props = Optional<LinkProps, 'href'>;

/**
 * Component for rendering a Next.js link using an anchor tag. This is mostly
 * to allow Next.js to preload routes and for the anchor tag to pass a11y.
 */
export const Link = forwardRef<HTMLAnchorElement, Props>(
  ({ children, href = '', ...props }, ref) => {
    let newTabProps: AnchorHTMLAttributes<HTMLElement> | undefined;
    const url = typeof href === 'string' ? href : href.href;

    if (url?.startsWith('http://') || url?.startsWith('https://')) {
      // For new tabs, add rel=noreferrer for security:
      // https://web.dev/external-anchors-use-rel-noopener/#how-to-improve-your-site's-performance-and-prevent-security-vulnerabilities
      newTabProps = {
        target: '_blank',
        rel: 'noreferrer',
      };
    }

    return (
      <NextLink {...props} {...newTabProps} href={href} ref={ref}>
        {children}
      </NextLink>
    );
  },
);
