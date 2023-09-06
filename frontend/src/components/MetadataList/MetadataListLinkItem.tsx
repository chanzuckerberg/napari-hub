import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@/components/Link/Link';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';
import { isExternalUrl } from '@/utils';

import styles from './MetadataList.module.scss';

interface Props {
  children: string;
  href: string;
  icon?: ReactNode;
  missingIcon?: ReactNode;
}

/**
 * Component for rendering link items in metadata lists. A link item can also
 * include an icon, or a missing icon if the URL is empty.
 */
export function MetadataListLinkItem({
  children,
  href,
  icon,
  missingIcon,
}: Props) {
  const plausible = usePlausible();
  const { plugin } = usePluginState();

  const itemClassName = 'ml-sds-xxs -mt-sds-xxs flex-grow';
  const internalLink = !isExternalUrl(href);

  return (
    <li className={clsx('flex', styles.linkItem)}>
      <span className="min-w-4">{href ? icon : missingIcon || icon}</span>

      {href ? (
        <Link
          className={clsx(itemClassName, 'underline')}
          href={href}
          onClick={
            internalLink
              ? undefined
              : () => {
                  const url = new URL(href);

                  if (plugin?.name) {
                    plausible('Links', {
                      host: url.host,
                      link: children,
                      plugin: plugin.name,
                      url: href,
                    });
                  }
                }
          }
        >
          {children}
        </Link>
      ) : (
        <span className={clsx(itemClassName, 'text-napari-gray')}>
          {children}
        </span>
      )}
    </li>
  );
}
