import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@/components/common/Link/Link';
import { usePlausible } from '@/hooks';
import styles from './MetadataList.module.scss';
import { isExternalUrl } from '@/utils';
// import { SEARCH_PAGE } from '@/store/search/constants';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Component for rendering text items in metadata lists.
 */
export function MetadataListSearchItem({ children, className }: Props) {
  const plausible = usePlausible();

  // not sure how to get text from children?
  const url = 'https://napari-hub.org/?search=' + { children };

  return (
    <li className={clsx(styles.textItem, className)}>
      <Link
        // className={clsx(itemClassName, 'underline')}
        href={url}
        // newTab={internalLink}
        // onClick={
        //   internalLink
        //     ? undefined
        //     : () => {
        //         const url = new URL(href);
        //
        //         if (plugin?.name) {
        //           plausible('Links', {
        //             host: url.host,
        //             link: children,
        //             plugin: plugin.name,
        //             url: href,
        //           });
        //         }
        //       }
        // }
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
