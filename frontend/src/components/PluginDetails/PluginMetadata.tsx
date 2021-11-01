import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { ReactNode } from 'react';

import { Divider } from '@/components/common/Divider';
import { Media } from '@/components/common/media';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { MetadataList, MetadataListTextItem } from '@/components/MetadataList';
import {
  Metadata,
  MetadataKeys,
  usePluginMetadata,
  usePluginState,
} from '@/context/plugin';
import { useIsPreview } from '@/hooks';

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
    <MetadataList
      className="screen-875:justify-self-center screen-1425:justify-self-start"
      title="GitHub activity"
    >
      {error ? (
        <li>
          <p className="text-napari-error mt-2">{error}</p>
        </li>
      ) : (
        items.map((item) => (
          <MetadataListTextItem key={item.title}>
            {item.title}: <span className="font-bold">{item.count}</span>
          </MetadataListTextItem>
        ))
      )}
    </MetadataList>
  );
}

interface CommonProps {
  /**
   * Class name to pass to root element.
   */
  className?: string;
}

interface PluginMetadataBaseProps extends CommonProps {
  divider: ReactNode;
  inline?: boolean;
}

/**
 * Utility type for picking keys that have a value that is a specific type. For
 * example, `PickMetadataKeys<string>` will return `'name' | 'summary' | ...`
 * because those metadata keys have strings as their value, while
 * `PickMetadataKeys<string[]>` will return `'operatingSystems' | 'requirements' | ...`,
 * because those metadata keys have string arrays as their values.
 */
type PickMetadataKeys<T> = {
  [Key in MetadataKeys]: Metadata[Key]['value'] extends T ? Key : never;
}[MetadataKeys];

/**
 * Component for rendering plugin metadata responsively.  This handles
 * rendering the divider for vertical layouts and rendering headers / values
 * inline for smaller screens.
 */
function PluginMetadataBase({
  className,
  divider,
  inline,
}: PluginMetadataBaseProps) {
  const metadata = usePluginMetadata();
  const isPreview = useIsPreview();

  function renderSingleItemList(key: PickMetadataKeys<string>) {
    const { name, value } = metadata[key];

    return (
      <MetadataList id={key} inline={inline} title={name} empty={!value}>
        <MetadataListTextItem>{value}</MetadataListTextItem>
      </MetadataList>
    );
  }

  function renderItemList(key: PickMetadataKeys<string[]>) {
    const { name, value: values } = metadata[key];

    return (
      <MetadataList
        id={key}
        inline={inline}
        title={name}
        empty={isEmpty(values)}
      >
        {values.map((value) => (
          <MetadataListTextItem key={value}>{value}</MetadataListTextItem>
        ))}
      </MetadataList>
    );
  }

  const projectMetadata = (
    <SkeletonLoader
      className="h-56"
      render={() => (
        <>
          {renderSingleItemList('version')}
          {renderSingleItemList('releaseDate')}
          {renderSingleItemList('firstReleased')}
          {renderItemList('developmentStatus')}
          {renderSingleItemList('license')}
        </>
      )}
    />
  );

  const requirementMetadata = (
    <SkeletonLoader
      className="h-56"
      render={() => (
        <>
          {renderSingleItemList('pythonVersion')}
          {renderItemList('operatingSystems')}
          {renderItemList('requirements')}
        </>
      )}
    />
  );

  const listClassName = clsx(isPreview ? 'space-y-2' : 'space-y-5');

  return (
    <div
      // ID is used to navigate to metadata using `View project data` link
      id="pluginMetadata"
      className={clsx(
        className,

        // Vertical 1-column grid layout for < xl
        'grid space-y-5',

        // Horizontal layout with 3-column grid for xl+
        'screen-875:grid-cols-3 screen-875:space-y-0',

        // Back to 1-column vertical layout for 3xl+
        'screen-1425:grid-cols-1 screen-1425:space-y-5',
      )}
    >
      <div className={listClassName}>{projectMetadata}</div>

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

      <div className={listClassName}>{requirementMetadata}</div>
    </div>
  );
}

/**
 * Component for rendering plugin metadata responsively.  This handles
 * rendering the divider for vertical layouts and rendering headers / values
 * inline for smaller screens.
 */
export function PluginMetadata(props: CommonProps) {
  let divider = <Divider className="mb-2" />;
  divider = (
    <>
      <Media greaterThanOrEqual="screen-1425">{divider}</Media>
      <Media lessThan="screen-875">{divider}</Media>
    </>
  );

  return (
    <>
      <Media lessThan="screen-1425">
        <PluginMetadataBase {...props} divider={divider} inline />
      </Media>

      <Media greaterThanOrEqual="screen-1425">
        <PluginMetadataBase {...props} divider={divider} />
      </Media>
    </>
  );
}
