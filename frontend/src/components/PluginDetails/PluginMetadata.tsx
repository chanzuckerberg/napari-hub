import clsx from 'clsx';
import { isArray, isEmpty } from 'lodash';
import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

import { Divider } from '@/components/common/Divider';
import { Media } from '@/components/common/media';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import {
  MetadataList,
  MetadataListTextItem,
  Props as MetadataListProps,
} from '@/components/MetadataList';
import {
  Metadata,
  MetadataId,
  MetadataKeys,
  usePluginMetadata,
  usePluginState,
} from '@/context/plugin';
import { PluginType } from '@/types';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';

import { MetadataListMetadataItem } from '../MetadataList/MetadataListMetadataItem';

interface GithubMetadataItem {
  label: string;
  count: number;
}

/**
 * Component for rendering plugin GitHub data.
 *
 * TODO Replace this with actual GitHub data.
 */
function PluginGithubData() {
  const { repo, repoFetchError } = usePluginState();
  const [t] = useTranslation(['pluginPage']);

  const items: GithubMetadataItem[] = [
    {
      label: t('pluginPage:github.stars'),
      count: repo.stars,
    },
    {
      label: t('pluginPage:github.forks'),
      count: repo.forks,
    },
    {
      label: t('pluginPage:github.issuesAndPrs'),
      count: repo.issuesAndPRs,
    },
  ];

  const error =
    repoFetchError &&
    t('pluginPage:github.fetchError', {
      replace: {
        status: repoFetchError.status,
      },
    });

  return (
    <MetadataList
      className="screen-875:justify-self-center screen-1425:justify-self-start"
      label={t('pluginPage:githubActivity')}
    >
      {error ? (
        <li>
          <p className="text-napari-error mt-2">{error}</p>
        </li>
      ) : (
        items.map((item) => (
          <MetadataListTextItem key={item.label}>
            {item.label}: <span className="font-bold">{item.count}</span>
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

type PickMetadataKey = MetadataKeys | 'supportedData';

/**
 * Utility type for picking keys that have a value that is a specific type. For
 * example, `PickMetadataKeys<string>` will return `'name' | 'summary' | ...`
 * because those metadata keys have strings as their value, while
 * `PickMetadataKeys<string[]>` will return `'operatingSystems' | 'requirements' | ...`,
 * because those metadata keys have string arrays as their values.
 */
type PickMetadataKeys<T> = {
  [Key in PickMetadataKey]: Metadata[Key]['value'] extends T ? Key : never;
}[PickMetadataKey];

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
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');

  function renderItemList(
    key: PickMetadataKeys<string | string[]>,
    props?: Partial<MetadataListProps>,
  ) {
    const { label, value } = metadata[key];
    const values = isArray(value) ? value : [value];

    return (
      <MetadataList
        id={`metadata-${key}` as MetadataId}
        inline={inline}
        label={label}
        empty={isEmpty(isArray(value) ? values : value)}
        {...props}
      >
        {values.map((currentValue) => (
          <MetadataListMetadataItem key={currentValue} metadataKey={key}>
            {currentValue}
          </MetadataListMetadataItem>
        ))}
      </MetadataList>
    );
  }

  const listClassName = clsx(process.env.PREVIEW ? 'space-y-2' : 'space-y-5');
  const spacingClassName = clsx(
    'space-y-5',
    'screen-875:space-y-0',
    'screen-1425:space-y-5',
  );

  return (
    <div
      // ID is used to navigate to metadata using `View project data` link
      id="pluginMetadata"
      className={clsx(
        className,
        spacingClassName,

        // Vertical 1-column grid layout for < xl
        'grid',

        // Horizontal layout with 3-column grid for xl+
        'screen-875:grid-cols-3',

        // Back to 1-column vertical layout for 3xl+
        'screen-1425:grid-cols-1',
      )}
    >
      <div className={listClassName}>
        <SkeletonLoader
          className="h-56"
          render={() => (
            <>
              {renderItemList('version')}
              {renderItemList('releaseDate', { highlight: false })}
              {renderItemList('firstReleased')}
              {renderItemList('license')}
            </>
          )}
        />
      </div>

      {divider}

      <div className={listClassName}>
        <SkeletonLoader
          className="h-56"
          render={() => (
            <>
              {renderItemList('supportedData', { highlight: false })}

              {isNpe2Enabled && (
                <>
                  {renderItemList('pluginType', { highlight: false })}

                  {metadata.pluginType.value.includes(PluginType.Reader) &&
                    renderItemList('readerFileExtensions', {
                      highlight: false,
                      inlineList: true,
                    })}

                  {metadata.pluginType.value.includes(PluginType.Writer) && (
                    <>
                      {renderItemList('writerFileExtensions', {
                        highlight: false,
                        inlineList: true,
                      })}
                      {renderItemList('writerSaveLayers', { highlight: false })}
                    </>
                  )}
                </>
              )}
            </>
          )}
        />
      </div>

      {divider}

      <Media className={spacingClassName} greaterThan="screen-1425">
        <SkeletonLoader
          className={clsx(
            'h-40',
            'screen-875:mx-6 screen-875:h-full',
            'screen-1425:mx-0 screen-1425:h-40',
          )}
          render={() => <PluginGithubData />}
        />

        {divider}
      </Media>

      <Media className={spacingClassName} lessThan="screen-875">
        <SkeletonLoader
          className={clsx(
            'h-40',
            'screen-875:mx-6 screen-875:h-full',
            'screen-1425:mx-0 screen-1425:h-40',
          )}
          render={() => <PluginGithubData />}
        />

        {divider}
      </Media>

      <div className={listClassName}>
        <SkeletonLoader
          className="h-56"
          render={() => (
            <>
              <Media between={['screen-875', 'screen-1425']}>
                <PluginGithubData />
              </Media>

              {renderItemList('pythonVersion')}
              {renderItemList('operatingSystems')}
              {renderItemList('requirements')}
            </>
          )}
        />
      </div>
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
      <Media lessThan="screen-875">
        <PluginMetadataBase {...props} divider={divider} inline />
      </Media>

      <Media greaterThanOrEqual="screen-875">
        <PluginMetadataBase {...props} divider={divider} />
      </Media>
    </>
  );
}
