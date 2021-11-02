import clsx from 'clsx';
import { ReactNode } from 'react-markdown';

import { Link } from '@/components/common/Link/Link';
import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { MetadataKeys, usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';
import { isExternalUrl } from '@/utils';

import styles from './MetadataList.module.scss';

interface Props {
  children: string;
  href: string;
  icon?: ReactNode;
  id?: MetadataKeys;
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
  id,
  missingIcon,
}: Props) {
  usePreviewClickAway(id);
  const plausible = usePlausible();
  const { plugin } = usePluginState();

  const itemClassName = 'ml-2 -mt-1 flex-grow';
  const internalLink = !isExternalUrl(href);

  return (
    <MetadataHighlighter
      id={id}
      component="li"
      className={clsx('flex', styles.linkItem)}
      highlight={!href}
    >
      <span className="min-w-4">{href ? icon : missingIcon || icon}</span>

      {href ? (
        <Link
          className={clsx(itemClassName, 'underline')}
          href={href}
          newTab={!internalLink}
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
    </MetadataHighlighter>
  );
}
