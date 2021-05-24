import NextLink, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes } from 'react';

interface Props extends AnchorHTMLAttributes<HTMLElement> {
  href: string;
  newTab?: boolean;
  linkProps?: LinkProps;
}

/**
 * Component for rendering a Next.js link using an anchor tag. This is mostly
 * to allow Next.js to preload routes and for the anchor tag to pass a11y.
 */
export function Link({
  children,
  href,
  linkProps = { href },
  newTab,
  ...props
}: Props) {
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
      <a href={href} {...props} {...newTabProps}>
        {children}
      </a>
    </NextLink>
  );
}
