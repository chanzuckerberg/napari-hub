import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

import {
  GitHub,
  ProjectDocumentation,
  ProjectIssues,
  ProjectSite,
  ProjectSupport,
  Quotes,
  Twitter,
} from '@/components/icons';
import { Media } from '@/components/media';
import { MetadataList, MetadataListLinkItem } from '@/components/MetadataList';
import { MetadataId, MetadataKeys, usePluginMetadata } from '@/context/plugin';

import { MetadataListMetadataItem } from '../MetadataList/MetadataListMetadataItem';
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
  const match = /https:\/\/github\.com\/([^/]+)\/(?<name>[^/]+)/.exec(repoUrl);
  return match?.groups?.name ?? '';
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
        'text-black bg-gray-100 p-5',

        // Overflow on x-axis in case of really long twitter names.
        'overflow-x-auto',

        // Grid layout.
        'grid',
        inline ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-12',
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

/**
 * Component for rendering SupportInfoBase responsively.  This includes
 * rendering the metadata list horizontally for xl+ layouts and inline for
 * smaller layouts.
 */
export function SupportInfo(props: CommonProps) {
  return (
    <>
      <Media greaterThanOrEqual="xl">
        <SupportInfoBase {...props} />
      </Media>

      <Media lessThan="xl">
        <SupportInfoBase {...props} inline />
      </Media>
    </>
  );
}
