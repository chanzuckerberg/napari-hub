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
export function Link({ href, linkProps = { href }, newTab, ...props }: Props) {
  if (newTab) {
    props.target = '_blank';
    props.rel = 'noreferrer';
  }

  return (
    <NextLink {...linkProps}>
      <a href={href} {...props} />
    </NextLink>
  );
}
