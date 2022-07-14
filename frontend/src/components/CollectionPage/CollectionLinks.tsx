import clsx from 'clsx';
import { Tooltip } from 'czifui';
import { useTranslation } from 'next-i18next';
import { GitHub, OrcID, Twitter, Website } from 'src/components/icons';
import { Link } from 'src/components/Link';
import { CollectionLinks as CollectionLinksType } from 'src/types/collections';

import { useCollection } from './context';

type LinkKey = keyof CollectionLinksType;

function useLinkData(key: LinkKey) {
  const { t } = useTranslation(['collections']);

  switch (key) {
    case 'orcid':
      return [t('collections:collectionPage.tooltips.visitOrcId'), OrcID];

    case 'github':
      return [t('collections:collectionPage.tooltips.visitGithub'), GitHub];

    case 'twitter':
      return [t('collections:collectionPage.tooltips.visitWebsite'), Twitter];

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
      classes={{
        tooltip: clsx(
          '!bg-[#f1f1ec] !border !border-[#dcdcdc]',
          '!p-sds-xxs !shadow-none',
          '!text-[#5b5b5b] !text-xs',
        ),
      }}
      title={tooltip}
      placement="bottom"
      interactive={false}
      leaveDelay={0}
    >
      <Link newTab href={link}>
        <Icon className="w-5 h-5" />
      </Link>
    </Tooltip>
  );
}

export function CollectionLinks() {
  const orderedLinks: LinkKey[] = ['orcid', 'twitter', 'github', 'website'];

  return (
    <div className="flex space-x-sds-xl mt-sds-xl">
      {orderedLinks.map((key) => (
        <CollectionLink linkKey={key} />
      ))}
    </div>
  );
}
