import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './MetadataList.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
}

export function MetadataListTextItem({ children, className }: Props) {
  return <li className={clsx(styles.textItem, className)}>{children}</li>;
}
