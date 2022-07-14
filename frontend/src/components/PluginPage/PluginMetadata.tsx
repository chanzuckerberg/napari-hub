import clsx from 'clsx';
import { isArray, isEmpty } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef } from 'react';

import { Divider } from '@/components/Divider';
import {
  MetadataList,
  MetadataListTextItem,
  Props as MetadataListProps,
} from '@/components/MetadataList';
import { SkeletonLoader } from '@/components/SkeletonLoader';
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
          <p className="text-napari-error mt-sds-s">{error}</p>
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

interface PluginMetadataProps {
  /**
   * Class name to pass to root element.
   */
  className?: string;

  /**
   * ID to pass to root element.
   */
  id?: string;

  /**
   * Render list items inline.
   */
  inline?: boolean;

  /**
   * Whether to add ID to plugin metadata to allow scrolling to. This needs to
   * be set manually by the parent component since this component is rendered in
   * different places depending on the screen size. Since markup for all screen
   * sizes are sent to the client, there will be multiple elements with the same
   * ID if without this prop.
   */
  enableScrollID?: boolean;
}

type PickMetadataKey = MetadataKeys | 'supportedData';

// ID is used to navigate to metadata using `View project data` link
export const PLUGIN_METADATA_ID = 'pluginMetadata';

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
export function PluginMetadata({
  className,
  inline,
  enableScrollID,
}: PluginMetadataProps) {
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

  const metadataRef = useRef<HTMLDivElement>(null);
  useEffect(() => {}, []);

  const divider = (
    <Divider className="mb-sds-s screen-875:hidden screen-1425:block" />
  );

  return (
    <div
      // ID is used to navigate to metadata using `View project data` link
      id={enableScrollID ? PLUGIN_METADATA_ID : undefined}
      ref={metadataRef}
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

      <div className={clsx(spacingClassName, 'hidden screen-1425:block')}>
        <SkeletonLoader
          className={clsx(
            'h-40',
            'screen-875:mx-6 screen-875:h-full',
            'screen-1425:mx-0 screen-1425:h-40',
          )}
          render={() => <PluginGithubData />}
        />

        {divider}
      </div>

      <div className={clsx(spacingClassName, 'screen-875:hidden')}>
        <SkeletonLoader
          className={clsx(
            'h-40',
            'screen-875:mx-6 screen-875:h-full',
            'screen-1425:mx-0 screen-1425:h-40',
          )}
          render={() => <PluginGithubData />}
        />

        {divider}
      </div>

      <div className={listClassName}>
        <SkeletonLoader
          className="h-56"
          render={() => (
            <>
              <div className="hidden screen-875:block screen-1425:hidden">
                <PluginGithubData />
              </div>

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
