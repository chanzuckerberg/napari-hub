import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@/components/common/Link/Link';

import { usePlausible } from '@/hooks';
import styles from './MetadataList.module.scss';
import { isExternalUrl } from '@/utils';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Component for rendering text items in metadata lists.
 */
export function MetadataListSearchItem({ children, className }: Props) {
  const plausible = usePlausible();

  const href = `https://napari-hub.org/?search="${encodeURIComponent(
    children,
  )}"`;
  const internalLink = !isExternalUrl(href);

  return (
    <li className={clsx(styles.textItem, className)}>
      <Link
        className={clsx('underline')}
        href={href}
        newTab={!internalLink}
        onClick={
          internalLink
            ? undefined
            : () => {
                const url = new URL(href);

                if (plugin?.name) {
                  plausible('Author Links', {
                    author: children,
                    plugin: plugin.name,
                  });
                }
              }
        }
      >
        {children}
      </Link>
    </li>
  );

  //   return (
  //     <li className={clsx(styles.textItem, className)}
  //     >

  //     </li>
  //   );
}
