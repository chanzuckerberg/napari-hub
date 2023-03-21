import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ComponentType } from 'react';
import { GitHub, OrcID, Twitter, Website } from 'src/components/icons';
import { Link } from 'src/components/Link';
import { Tooltip } from 'src/components/Tooltip';
import { CollectionLinks as CollectionLinksType } from 'src/types/collections';

import { IconColorProps } from '../icons/icons.type';
import { useCollection } from './context';

type LinkKey = keyof CollectionLinksType;

function useLinkData(key: LinkKey): [string, ComponentType<IconColorProps>] {
  const { t } = useTranslation(['collections']);

  switch (key) {
    case 'orcid':
      return [t('collections:collectionPage.tooltips.visitOrcId'), OrcID];

    case 'github':
      return [t('collections:collectionPage.tooltips.visitGithub'), GitHub];

    case 'twitter':
      return [t('collections:collectionPage.tooltips.visitTwitter'), Twitter];

    case 'website':
      return [t('collections:collectionPage.tooltips.visitWebsite'), Website];

    default:
      return ['', OrcID];
  }
}

function useLink(key: LinkKey) {
  const collection = useCollection();
  const { links } = collection.curator;

  switch (key) {
    case 'orcid':
      return `https://orcid.org/${links?.[key] ?? ''}`;

    default:
      return links?.[key];
  }
}

interface CollectionLinkProps {
  linkKey: LinkKey;
}

function CollectionLink({ linkKey }: CollectionLinkProps) {
  const [tooltip, Icon] = useLinkData(linkKey);
  const link = useLink(linkKey);

  return (
    <Tooltip
      arrow={false}
      classes={{
        tooltip: clsx(
          '!bg-[#f1f1ec] !border !border-[#dcdcdc]',
          '!p-sds-xxs !shadow-none',
          '!text-[#5b5b5b] !text-xs',
        ),
      }}
      title={tooltip}
      placement="bottom"
      disableInteractive
      leaveDelay={0}
    >
      <Link aria-label={tooltip} href={link}>
        <Icon className="w-5 h-5" />
      </Link>
    </Tooltip>
  );
}

export function CollectionLinks() {
  const collection = useCollection();
  const orderedLinks: LinkKey[] = ['orcid', 'twitter', 'github', 'website'];
  const filteredLinks = orderedLinks.filter(
    (link) => collection.curator.links?.[link],
  );

  return (
    <div className="flex space-x-sds-xl mt-sds-xl">
      {filteredLinks.map((key) => (
        <CollectionLink key={key} linkKey={key} />
      ))}
    </div>
  );
}
