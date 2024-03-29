import dynamic from 'next/dynamic';
import withLoadingProps from 'next-dynamic-loading-props';
import { CodeProps } from 'react-markdown/lib/ast-to-react';

import { SyntaxHighlighterProps } from './SyntaxHighlighter';

/**
 * The SyntaxHighlighter component uses a library that only works on the
 * client, so we need to lazy-load it only on the client side. Otherwise, the
 * server will throw an error about being unable to import the syntax
 * highlighting module.
 */
const SyntaxHighlighter = withLoadingProps<SyntaxHighlighterProps>(
  (useLoadingProps) => {
    /**
     * Default unstyled code component for rendering the code while the syntax
     * highlighter is loading.
     */
    function Loader() {
      const props = useLoadingProps();
      return <code {...props} />;
    }

    return dynamic(
      () => import('./SyntaxHighlighter').then((mod) => mod.SyntaxHighlighter),
      {
        ssr: false,
        loading: Loader,
      },
    );
  },
);

/**
 * Component for rendering markdown code with syntax highlighting.
 */
export function MarkdownCode({
  className,
  inline,
  children,
  node,
  ...props
}: CodeProps) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] ?? '';

  // Remove extra line that usually gets added to the end of files
  const code = String(children).replace(/\n$/, '');
  const hasLink = node.children.some((child) => child.tagName === 'a');

  if (inline || hasLink) {
    return <code {...props}>{hasLink ? children : code}</code>;
  }

  return (
    <SyntaxHighlighter language={language} {...props}>
      {code}
    </SyntaxHighlighter>
  );
}
