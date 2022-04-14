import NextLink, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes, forwardRef } from 'react';

export interface Props extends AnchorHTMLAttributes<HTMLElement> {
  newTab?: boolean;
  linkProps?: LinkProps;
}

/**
 * Component for rendering a Next.js link using an anchor tag. This is mostly
 * to allow Next.js to preload routes and for the anchor tag to pass a11y.
 */
export const Link = forwardRef<HTMLAnchorElement, Props>(
  ({ children, href = '', linkProps = { href }, newTab, ...props }, ref) => {
    let newTabProps: AnchorHTMLAttributes<HTMLElement> | undefined;

    if (newTab) {
      // For new tabs, add rel=noreferrer for security:
      // https://web.dev/external-anchors-use-rel-noopener/#how-to-improve-your-site's-performance-and-prevent-security-vulnerabilities
      newTabProps = {
        target: '_blank',
        rel: 'noreferrer',
      };
    }

    return (
      <NextLink {...linkProps}>
        <a href={href} {...props} {...newTabProps} ref={ref}>
          {children}
        </a>
      </NextLink>
    );
  },
);
