import { ReactElement, ReactNode } from 'react';

/**
 * Checks if a React node is an element. An element is an instantiated
 * component.
 *
 * @param node The React node
 * @returns True if node is an element
 */
export function isReactElement(node: ReactNode): node is ReactElement {
  const element = node as ReactElement | null | undefined;
  return !!(element?.type && element?.props);
}
