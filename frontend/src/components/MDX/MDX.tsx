import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { ComponentProps } from 'react';

import { Accordion } from '@/components/Accordion';
import { LayoutMDX } from '@/components/LayoutMDX';

import { MDXLinkNode } from './MDXLinkNode';

interface Props {
  mdxSource: MDXRemoteSerializeResult;
}

function MDXAccordion(props: ComponentProps<typeof Accordion>) {
  return <Accordion variant="faq" {...props} />;
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
        LayoutMDX,
        Accordion: MDXAccordion,
        a: MDXLinkNode,
      }}
    />
  );
}
