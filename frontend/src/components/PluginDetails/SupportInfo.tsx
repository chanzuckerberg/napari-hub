import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { ReactNode } from 'react';

import {
  GitHub,
  ProjectDocumentation,
  ProjectIssues,
  ProjectSite,
  ProjectSupport,
  Quotes,
  Twitter,
} from '@/components/common/icons';
import { Media } from '@/components/common/media';
import {
  MetadataList,
  MetadataListLinkItem,
  MetadataListTextItem,
} from '@/components/MetadataList';
import { MetadataKeys, usePluginMetadata } from '@/context/plugin';

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

interface CommonProps {
  /**
   * Class name to pass to root element.
   */
  className?: string;
}

interface MetadataLinkItem {
  id: MetadataKeys;
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
  const metadata = usePluginMetadata();
  const learnMoreItems: MetadataLinkItem[] = [];

  function getLink(key: MetadataKeys) {
    const data = metadata[key];

    return {
      id: key,
      text: data.name,
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
      href: `${metadata.name.value}#${ANCHOR}`,
      text: metadata.citations.name,
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
        inline ? 'grid-cols-1 gap-4' : 'grid-cols-3',
      )}
    >
      <MetadataList
        id="authors"
        title={metadata.authors.name}
        empty={isEmpty(metadata.authors.value)}
        inline={inline}
      >
        {metadata.authors.value.map((author) => (
          <MetadataListTextItem key={author}>{author}</MetadataListTextItem>
        ))}
      </MetadataList>

      <MetadataList title="Learn more" inline={inline}>
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
        id="sourceCode"
        title={metadata.sourceCode.name}
        empty={!metadata.sourceCode.value}
        inline={inline}
      >
        {metadata.sourceCode.value && (
          <MetadataListLinkItem
            href={metadata.sourceCode.value}
            icon={<GitHub />}
            missingIcon={<GitHub className={styles.missingGithub} />}
          >
            {metadata.name.value}
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
