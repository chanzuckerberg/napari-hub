import clsx from 'clsx';
import { isArray } from 'lodash';
import { ReactNode } from 'react';

import { Divider } from '@/components/common/Divider';
import { MediaFragment } from '@/components/common/media';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { usePluginState } from '@/context/plugin';
import { formatDate } from '@/utils';

import { MetadataList } from './MetadataList';

interface GithubMetadataItem {
  title: string;
  count: number;
}

/**
 * Component for rendering plugin GitHub data.
 *
 * TODO Replace this with actual GitHub data.
 */
function PluginGithubData() {
  const { repo, repoFetchError } = usePluginState();
  const items: GithubMetadataItem[] = [
    {
      title: 'Stars',
      count: repo.stars,
    },
    {
      title: 'Forks',
      count: repo.forks,
    },
    {
      title: 'Issues + PRs',
      count: repo.issuesAndPRs,
    },
  ];
  const error =
    repoFetchError &&
    `We're having trouble loading the GitHub stats: ${repoFetchError.status}`;

  return (
    <div
      className={clsx(
        // Layout
        'flex flex-col',

        // Centering only for xl layout
        'items-start xl:items-center 2xl:items-start',

        // Font
        'text-sm',
      )}
    >
      <h4 className="font-bold">Github Activity</h4>
      {error ? (
        <p className="text-napari-error mt-2">{error}</p>
      ) : (
        <ul className="list-none">
          {items.map((item) => (
            <li className="my-2" key={item.title}>
              {item.title}: <span className="font-bold">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CommonProps {
  /**
   * Class name to pass to root element.
   */
  className?: string;
}

interface PluginMetadataBaseProps extends CommonProps {
  /**
   * Divider to render between metadata lists.
   */
  divider?: ReactNode;

  /**
   * Render metadata lists inline.
   */
  inline?: boolean;
}

/**
 * Component for rendering plugin metadata sidebar in the plugin details page.
 *
 * TODO Replace with actual plugin data.
 */

function PluginMetadataBase({
  className,
  divider,
  inline,
}: PluginMetadataBaseProps) {
  const { plugin } = usePluginState();

  const projectMetadata = (
    <SkeletonLoader
      className="h-56"
      render={() => (
        <MetadataList
          inline={inline}
          items={[
            {
              title: 'Version',
              value: plugin?.version ?? '',
            },
            {
              title: 'Release date',
              value: plugin?.release_date
                ? formatDate(plugin.release_date)
                : '',
            },
            {
              title: 'First released',
              value: plugin?.first_released
                ? formatDate(plugin.first_released)
                : '',
            },
            {
              title: 'Development status',
              value:
                plugin?.development_status
                  ?.map(
                    (status) =>
                      status?.replace('Development Status :: ', '') ?? '',
                  )
                  .filter((value): value is string => !!value) ?? [],
            },
            {
              title: 'License',
              value: plugin?.license ?? '',
            },
          ]}
        />
      )}
    />
  );

  const requirementMetadata = (
    <SkeletonLoader
      className="h-56"
      render={() => (
        <MetadataList
          inline={inline}
          items={[
            {
              title: 'Python versions supported',
              value: plugin?.python_version ?? '',
            },
            {
              title: 'Operating system',
              value: plugin?.operating_system
                ? plugin.operating_system
                    .map((operatingSystem) =>
                      operatingSystem?.replace('Operating System :: ', ''),
                    )
                    .filter((value): value is string => !!value)
                : '',
            },
            {
              title: 'Requirements',
              value:
                plugin?.requirements && isArray(plugin.requirements)
                  ? plugin.requirements.filter(
                      (req): req is string => !req?.includes('; extra == '),
                    )
                  : '',
            },
          ]}
        />
      )}
    />
  );

  return (
    <div
      // ID is used to navigate to metadata using `View project data` link
      id="pluginMetadata"
      className={clsx(
        className,

        // Vertical 1-column grid layout for < xl
        'grid',

        // Horizontal layout with 3-column grid for xl+
        'xl:grid-cols-3',

        // Back to 1-column vertical layout for 3xl+
        '3xl:grid-cols-1',
      )}
    >
      {projectMetadata}
      {divider}
      <SkeletonLoader
        className={clsx(
          'h-40',
          'screen-875:mx-6 screen-875:h-full',
          'screen-1425:mx-0 screen-1425:h-40',
        )}
        render={() => <PluginGithubData />}
      />
      {divider}
      {requirementMetadata}
    </div>
  );
}

/**
 * Component for rendering plugin metadata responsively.  This handles
 * rendering the divider for vertical layouts and rendering headers / values
 * inline for smaller screens.
 */
export function PluginMetadata(props: CommonProps) {
  let divider = <Divider className="my-6" />;
  divider = (
    <>
      <MediaFragment greaterThanOrEqual="3xl">{divider}</MediaFragment>
      <MediaFragment lessThan="xl">{divider}</MediaFragment>
    </>
  );

  return (
    <>
      <MediaFragment lessThan="3xl">
        <PluginMetadataBase {...props} divider={divider} inline />
      </MediaFragment>

      <MediaFragment greaterThanOrEqual="3xl">
        <PluginMetadataBase {...props} divider={divider} />
      </MediaFragment>
    </>
  );
}
