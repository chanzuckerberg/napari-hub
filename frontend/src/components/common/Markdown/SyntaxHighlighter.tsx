import clsx from 'clsx';
import Head from 'next/head';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';

import { transformTokens } from './Markdown.utils';
import styles from './SyntaxHighlighter.module.scss';

interface LineNumbersProps {
  length: number;
}

function LineNumbers({ length }: LineNumbersProps) {
  return (
    <div
      className={clsx(styles.lineNumbers, 'p-4 pr-2 shadow z-10 text-right')}
    >
      {Array.from({ length }, (_, index) => (
        <div key={`line-${index}`} className="select-none">
          {index + 1}
        </div>
      ))}
    </div>
  );
}

export interface SyntaxHighlighterProps {
  language: string;
  children: string;
}

/**
 * Component for rendering syntax highlighting using the prism-react-renderer
 * library:
 * https://github.com/FormidableLabs/prism-react-renderer#faq
 */
export function SyntaxHighlighter({
  children,
  language,
}: SyntaxHighlighterProps) {
  return (
    <>
      <Head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Highlight
        {...defaultProps}
        code={children}
        language={language as Language}
        // Explicitly pass `undefined` so that we can use a custom CSS theme:
        // https://github.com/FormidableLabs/prism-react-renderer#faq
        theme={undefined}
      >
        {({
          className,
          style,
          tokens: rawTokens,
          getLineProps,
          getTokenProps,
        }) => {
          const tokens = transformTokens(rawTokens);

          return (
            <div className="grid grid-cols-[min-content,1fr]">
              <LineNumbers length={tokens.length} />

              <pre className={clsx(className, styles.code)} style={style}>
                {tokens.map((line, index) => (
                  <div {...getLineProps({ line, key: index })}>
                    {line.map((token, key) => (
                      <span {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ))}
              </pre>
            </div>
          );
        }}
      </Highlight>
    </>
  );
}
