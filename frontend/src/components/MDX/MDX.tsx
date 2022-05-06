import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';

import { Accordion } from '@/components/Accordion';
import { LayoutMDX } from '@/components/LayoutMDX';

import { MDXLinkNode } from './MDXLinkNode';

interface Props {
  mdxSource: MDXRemoteSerializeResult;
}

/**
 * Component for rendering React nodes from MDX strings.
 *
 * TODO Look into consolidating with Markdown component.
 * Markdown is a subset of MDX so we may be able to combine the two components.
 */
export function MDX({ mdxSource }: Props) {
  return (
    <MDXRemote
      {...mdxSource}
      components={{
        Accordion,
        LayoutMDX,
        a: MDXLinkNode,
      }}
    />
  );
}
