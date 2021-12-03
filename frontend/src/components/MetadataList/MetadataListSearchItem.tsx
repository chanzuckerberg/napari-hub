import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@/components/common/Link/Link';
import { usePlausible } from '@/hooks';
import styles from './MetadataList.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Component for rendering text items in metadata lists.
 */
export function MetadataListSearchItem({ children, className }: Props) {
  const plausible = usePlausible();
  return <li className={clsx(styles.textItem, className)}>{children}</li>;

  //   return (
  //     <li className={clsx(styles.textItem, className)}
  //     >

  //     </li>
  //   );
}
