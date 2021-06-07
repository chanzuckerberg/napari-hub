import { ReactHTML } from 'react';
import { Node } from 'unist';

export interface MarkdownNode extends Node {
  children: MarkdownNode[];
  tagName: keyof ReactHTML;
}

export interface TextNode extends MarkdownNode {
  value: string;
}

export interface HeadingNode extends MarkdownNode {
  children: [TextNode];
  properties: {
    id: string;
  };
}
