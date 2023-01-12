import clsx from 'clsx';
import { ButtonIcon } from 'czifui';
import { isEmpty } from 'lodash';
import { useTranslation } from 'next-i18next';
import { ReactNode, useCallback, useState } from 'react';

import {
  Code,
  GitHub,
  ProjectDocumentation,
  ProjectIssues,
  ProjectSite,
  ProjectSupport,
  Quotes,
  Twitter,
  Website,
} from '@/components/icons';
import { Link } from '@/components/Link';
import { MetadataList, MetadataListLinkItem } from '@/components/MetadataList';
import { MetadataListMetadataItem } from '@/components/MetadataList/MetadataListMetadataItem';
import { Tooltip } from '@/components/Tooltip';
import { MetadataId, MetadataKeys, usePluginMetadata } from '@/context/plugin';

import { ANCHOR } from './CitationInfo.constants';
import styles from './SupportInfo.module.scss';

/**
 * Extracts a Twitter's username from the given Twitter URL.  Regex copied
 * from: https://stackoverflow.com/a/5948248
 *
 * @param url Twitter URL
 * @returns Username from Twitter URL, or empty string if not found
 */
function formatTwitter(url: string): string {
  const match =
    /^https?:\/\/(www\.)?twitter\.com\/(#!\/)?(?<name>[^/]+)(\/\w+)*$/.exec(
      url,
    );

  if (match) {
    return `@${String(match.groups?.name)}`;
  }

  return '';
}

function formatRepoName(repoUrl: string): string {
  const match = /https:\/\/github\.com\/(?<owner>[^/]+)\/(?<name>[^/]+)/.exec(
    repoUrl,
  );
  const owner = match?.groups?.owner ?? '';
  const name = match?.groups?.name ?? '';

  if (!owner || !name) {
    return repoUrl;
  }

  return `${owner}/${name}`;
}

interface CommonProps {
  /**
   * Class name to pass to root element.
   */
  className?: string;
}

interface MetadataLinkItem {
  id: MetadataId;
  text: string;
  href: string;
  icon?: ReactNode;
  missingIcon?: ReactNode;
}

interface SupportInfoBaseProps extends CommonProps {
  /**
   * Render the support info metadata list items inline.
   */
  inline?: boolean;
}

export function SupportInfoBase({ className, inline }: SupportInfoBaseProps) {
  const [t] = useTranslation(['common']);
  const metadata = usePluginMetadata();
  const learnMoreItems: MetadataLinkItem[] = [];

  function getLink(key: MetadataKeys): MetadataLinkItem {
    const data = metadata[key];

    return {
      id: `metadata-${key}`,
      text: data.label,
      href: data.value as string,
    };
  }

  if (metadata.projectSite.value) {
    learnMoreItems.push({
      ...getLink('projectSite'),
      icon: <ProjectSite />,
    });
  }

  learnMoreItems.push(
    {
      ...getLink('documentationSite'),
      icon: <ProjectDocumentation />,
      missingIcon: (
        <ProjectDocumentation className={styles.missingDocumentation} />
      ),
    },
    {
      ...getLink('supportSite'),
      icon: <ProjectSupport />,
      missingIcon: <ProjectSupport className={styles.missingProjectSupport} />,
    },
    {
      ...getLink('reportIssues'),
      icon: <ProjectIssues />,
      missingIcon: <ProjectIssues className={styles.missingProjectIssues} />,
    },
  );

  if (metadata.twitter.value) {
    const { id, href } = getLink('twitter');

    learnMoreItems.push({
      id,
      href,
      text: formatTwitter(href),
      icon: <Twitter />,
    });
  }

  if (metadata.citations.value) {
    learnMoreItems.push({
      id: 'metadata-citations',
      href: `#${ANCHOR}`,
      text: metadata.citations.label,
      icon: <Quotes />,
    });
  }

  return (
    <div
      className={clsx(
        className,
        'text-black bg-gray-100 p-sds-xl',

        // Overflow on x-axis in case of really long twitter names.
        'overflow-x-auto',

        // Grid layout.
        'grid',
        inline ? 'grid-cols-1 gap-sds-l' : 'grid-cols-3 gap-12',
      )}
    >
      <MetadataList
        id="metadata-authors"
        label={metadata.authors.label}
        empty={isEmpty(metadata.authors.value)}
        inline={inline}
      >
        {metadata.authors.value.map((author) => (
          <MetadataListMetadataItem key={author} metadataKey="authors">
            {author}
          </MetadataListMetadataItem>
        ))}
      </MetadataList>

      <MetadataList label={t('common:learnMore')} inline={inline}>
        {learnMoreItems.map(({ text, id, ...linkProps }) => (
          <MetadataListLinkItem
            key={linkProps.href + text}
            id={id}
            {...linkProps}
          >
            {text}
          </MetadataListLinkItem>
        ))}
      </MetadataList>

      <MetadataList
        id="metadata-sourceCode"
        label={metadata.sourceCode.label}
        empty={!metadata.sourceCode.value}
        inline={inline}
      >
        {metadata.sourceCode.value && (
          <MetadataListLinkItem
            href={metadata.sourceCode.value}
            icon={<GitHub />}
            missingIcon={<GitHub className={styles.missingGithub} />}
          >
            {formatRepoName(metadata.sourceCode.value) || metadata.name.value}
          </MetadataListLinkItem>
        )}
      </MetadataList>
    </div>
  );
}

interface LinkData {
  label: string;
  value: string;
}

interface LinksProps {
  links: LinkData[];
  children: ReactNode;
}

function Links({ children, links }: LinksProps) {
  const [open, setOpen] = useState(false);

  const openTooltip = useCallback(() => {
    setOpen(true);
  }, []);

  const closeTooltip = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Tooltip
      border={false}
      classes={{
        tooltip: 'p-0',
      }}
      open={open}
      onOpen={openTooltip}
      onClose={closeTooltip}
      title={
        <ul>
          {links.map((link) => (
            <li className="hover:bg-hub-gray-100 py-sds-s px-sds-l">
              <Link href={link.value}>{link.label}</Link>
            </li>
          ))}
        </ul>
      }
    >
      <ButtonIcon onClick={openTooltip}>{children}</ButtonIcon>
    </Tooltip>
  );
}

function CodeLinks() {
  const metadata = usePluginMetadata();

  return (
    <Links links={[metadata.sourceCode]}>
      <Code />
    </Links>
  );
}

function WebsiteLinks() {
  const metadata = usePluginMetadata();

  return (
    <Links links={[metadata.projectSite, metadata.documentationSite]}>
      <Website />
    </Links>
  );
}

function SupportLinks() {
  const metadata = usePluginMetadata();

  return (
    <Links links={[metadata.supportSite, metadata.reportIssues]}>
      <ProjectSupport className="ml-2" />
    </Links>
  );
}

interface Props {
  className?: string;
}

/**
 * Component for rendering support info links as icon dropdowns.
 */
export function SupportInfo({ className }: Props) {
  return (
    <div className={clsx('flex items-center gap-x-sds-l', className)}>
      <CodeLinks />
      <WebsiteLinks />
      <SupportLinks />
    </div>
  );
}
