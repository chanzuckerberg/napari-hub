import NextLink, { LinkProps } from 'next/link';
import { ReactNode } from 'react';

interface Props extends LinkProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Component for rendering a Next.js link using an anchor tag. This is mostly
 * to allow Next.js to preload routes and for the anchor tag to pass a11y.
 */
export function Link({ className, children, ...props }: Props) {
  return (
    <NextLink {...props}>
      <a className={className} href={props.href.toString()}>
        {children}
      </a>
    </NextLink>
  );
}
