import clsx from 'clsx';
import { ReactNode } from 'react-markdown';

import { Link } from '@/components/common/Link/Link';
import { MetadataStatus } from '@/components/MetadataStatus';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';
import { isExternalUrl } from '@/utils';

import { useMetadataContext } from './metadata.context';
import styles from './MetadataList.module.scss';

interface Props {
  children: string;
  href: string;
  icon?: ReactNode;
  missingIcon?: ReactNode;
}

export function MetadataListLinkItem({
  children,
  href,
  icon,
  missingIcon,
}: Props) {
  const plausible = usePlausible();
  const { plugin } = usePluginState();
  const { inline } = useMetadataContext();
  const isPreview = !!process.env.PREVIEW;
  const itemClassName = 'ml-2 -mt-1 flex-grow';
  const internalLink = !isExternalUrl(href);

  return (
    <li
      className={clsx(
        'flex',
        styles.linkItem,
        isPreview && !href && 'bg-napari-preview-orange-overlay',
      )}
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

      {isPreview && !href && (
        <MetadataStatus
          hasValue={false}
          variant={inline ? 'inline' : 'regular'}
        />
      )}
    </li>
  );
}
