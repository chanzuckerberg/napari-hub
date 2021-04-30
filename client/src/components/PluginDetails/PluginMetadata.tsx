import clsx from 'clsx';
import { ReactNode } from 'react-markdown';

import { Divider } from '@/components/common';
import { MediaFragment } from '@/components/common/media';
import { formatDate } from '@/utils/date';

import { MetadataList } from './MetadataList';
import { MetadataItem } from './PluginDetails.types';
import { usePluginState } from './PluginStateContext';

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
  const items: GithubMetadataItem[] = [
    {
      title: 'Stars',
      count: 0,
    },
    {
      title: 'Forks',
      count: 0,
    },
    {
      title: 'Issues + PRs',
      count: 0,
    },
  ];

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
      <ul className="list-none">
        {items.map((item) => (
          <li className="my-2" key={item.title}>
            {item.title}: <span className="font-bold">{item.count}</span>
          </li>
        ))}
      </ul>
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

  const projectItems: MetadataItem[] = [
    {
      title: 'Version',
      value: plugin.version,
    },
    {
      title: 'Release date',
      value: formatDate(plugin.release_date),
    },
    {
      title: 'First released',
      value: formatDate(plugin.first_released),
    },
    {
      title: 'Development status',
      value: plugin.development_status.map((status) =>
        status.replace('Development Status :: ', ''),
      ),
    },
    {
      title: 'License',
      value: plugin.license,
    },
  ];

  const requirementItems: MetadataItem[] = [
    {
      title: 'Python versions supported',
      value: plugin.python_version,
    },
    {
      title: 'Operating system',
      value: plugin.operating_system.map((operatingSystem) =>
        operatingSystem.replace('Operating System :: ', ''),
      ),
    },
    {
      title: 'Requirements',
      value: plugin.requirements,
    },
  ];

  return (
    <div
      id="pluginMetadata"
      className={clsx(
        className,

        // Vertical layout for < xl
        'flex flex-col',

        // Horizontal layout with 3 column grid for xl+
        'xl:grid xl:grid-cols-[1fr,1fr,1fr]',

        // Back to vertical layout for 3xl+
        '3xl:flex',
      )}
    >
      <MetadataList inline={inline} items={projectItems} />
      {divider}
      <PluginGithubData />
      {divider}
      <MetadataList inline={inline} items={requirementItems} />
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
