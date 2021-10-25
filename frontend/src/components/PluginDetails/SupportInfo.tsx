import clsx from 'clsx';

import {
  GitHub,
  ProjectDocumentation,
  ProjectIssues,
  ProjectSite,
  ProjectSupport,
  Twitter,
} from '@/components/common/icons';
import { Media } from '@/components/common/media';
import { usePluginState } from '@/context/plugin';

import { MetadataList } from './MetadataList';
import { MetadataItem, MetadataItemLink } from './PluginDetails.types';
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

interface SupportInfoBaseProps extends CommonProps {
  /**
   * Render the support info metadata list horizontally.
   */
  horizontal?: boolean;

  /**
   * Render the support info metadata list items inline.
   */
  inline?: boolean;
}

export function SupportInfoBase({
  className,
  horizontal,
  inline,
}: SupportInfoBaseProps) {
  const { plugin } = usePluginState();

  const items: MetadataItem[] = [
    {
      title: 'Authors',
      value: plugin.authors.map((author) => author.name),
    },

    {
      title: 'Learn more',
      value: ([] as MetadataItemLink[]).concat(
        plugin.project_site
          ? {
              href: plugin.project_site,
              icon: <ProjectSite />,
              text: 'Project site',
            }
          : [],

        {
          href: plugin.documentation,
          icon: <ProjectDocumentation />,
          missingIcon: (
            <ProjectDocumentation className={styles.missingDocumentation} />
          ),
          text: 'Documentation',
        },
        {
          href: plugin.support,
          icon: <ProjectSupport />,
          missingIcon: (
            <ProjectSupport className={styles.missingProjectSupport} />
          ),
          text: 'Support',
        },
        {
          href: plugin.report_issues,
          icon: <ProjectIssues />,
          missingIcon: (
            <ProjectIssues className={styles.missingProjectIssues} />
          ),
          text: 'Report issues',
        },

        plugin.twitter
          ? {
              href: plugin.twitter,
              icon: <Twitter />,
              text: formatTwitter(plugin.twitter),
            }
          : [],
      ),
    },

    {
      title: 'Source code',
      value: plugin.code_repository && {
        href: plugin.code_repository,
        icon: <GitHub />,
        text: plugin.name,
      },
    },
  ];

  return (
    <MetadataList
      className={clsx('text-black bg-gray-100 p-5', className)}
      horizontal={horizontal}
      inline={inline}
      items={items}
    />
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
        <SupportInfoBase {...props} horizontal />
      </Media>

      <Media lessThan="xl">
        <SupportInfoBase {...props} inline />
      </Media>
    </>
  );
}
