import { ReactNode } from 'react';

import { isReactElement } from '@/utils';

interface Props {
  className?: string;
  children?: ReactNode | ReactNode[];
}

const ALLOWED_VIDEO_REGEX =
  /https:\/\/(user-images\.githubusercontent)\.com.*(mp4|mov)/;

/**
 * Component for rendering a paragraph element, or a video element if the
 * content is a GitHub video link.
 */
export function MarkdownParagraph({ className, children }: Props) {
  let result: ReactNode;

  if (
    Array.isArray(children) &&
    // GitHub only renders video links as videos if it's the only child in the
    // paragraph AST. To be consistent with this, we need to check that the link
    // node is the only node.
    children.length === 1 &&
    isReactElement(children[0]) &&
    // Check that node is a link
    children[0].type === 'a'
  ) {
    const [child] = children;
    const { href } = child.props as { href: string };
    const match = ALLOWED_VIDEO_REGEX.exec(href);

    if (match) {
      result = (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          data-testid="markdownVideo"
          className={className}
          controls
          src={href}
        />
      );
    }
  }

  return result ?? <p className={className}>{children}</p>;
}
