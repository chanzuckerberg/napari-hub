import { ReactNode } from 'react';
import { PrismAsync as Highlight } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface SyntaxHighlighterProps {
  language: string;
  children: ReactNode;
}

/**
 * Component for rendering syntax highlighting in Markdown. This uses the
 * `PrismAsync` component to also code-split and lazy-load the highlighting
 * library since it's large library (About 2MB GZipped in dev mode).
 *
 * TODO If necessary, investigate ways to make loading this library faster.
 * Maybe we can use `PrismAsyncLight` and limit markdown syntax highlighting to
 * a smaller subset of languages for faster processing:
 * https://github.com/react-syntax-highlighter/react-syntax-highlighter#light-build
 */
export function SyntaxHighlighter({
  children,
  language,
  ...props
}: SyntaxHighlighterProps) {
  return (
    <Highlight
      language={language}
      showLineNumbers
      // Themes aren't typed for some reason, so ignore unsafe assignment error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      style={materialLight}
      {...props}
    >
      {children}
    </Highlight>
  );
}
