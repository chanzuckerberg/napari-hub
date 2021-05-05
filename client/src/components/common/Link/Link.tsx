import NextLink, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes, ReactNode } from 'react';

interface Props extends LinkProps {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  newTab?: boolean;
}

/**
 * Component for rendering a Next.js link using an anchor tag. This is mostly
 * to allow Next.js to preload routes and for the anchor tag to pass a11y.
 */
export function Link({
  className,
  children,
  onClick,
  newTab,
  ...props
}: Props) {
  const linkProps: AnchorHTMLAttributes<HTMLElement> = {
    className,
    onClick,
    href: props.href.toString(),
  };

  if (newTab) {
    linkProps.target = '_blank';
    linkProps.rel = 'noreferrer';
  }

  return (
    <NextLink {...props}>
      <a {...linkProps}>{children}</a>
    </NextLink>
  );
}
