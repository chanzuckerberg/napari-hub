import Highlighter from 'react-highlight-words';

export interface Props {
  /**
   * Class to pass to root element.
   */
  className?: string;

  /**
   * Disables text highlighting and renders the text as-is.
   */
  disabled?: boolean;

  /**
   * The text to render.
   */
  children: string;

  /**
   * Words to highlight.
   */
  words?: Array<string | undefined>;
}

/**
 * Renders text with some of the words highlighted.
 */
export function TextHighlighter({
  className,
  children,
  disabled,
  words = [],
}: Props) {
  return (
    <>
      {disabled ? (
        children
      ) : (
        <Highlighter
          className={className}
          highlightClassName="bg-napari-light"
          searchWords={words.filter(Boolean) as string[]}
          textToHighlight={children}
        />
      )}
    </>
  );
}
