import clsx from 'clsx';

import { Divider } from '@/components/common';
import { Media } from '@/components/common/media';
import { formatDate } from '@/utils/date';

import { MetadataList } from './MetadataList';
import { MetadataItem } from './PluginDetails.types';
import { usePluginState } from './PluginStateContext';

function renderDivider(className: string, render: boolean) {
  return render && <Divider className={clsx(className, 'my-6')} />;
}

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

interface Props {
  className?: string;
}

/**
 * Component for rendering plugin metadata sidebar in the plugin details page.
 *
 * TODO Replace with actual plugin data.
 */
export function PluginMetadata({ className }: Props) {
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

  // Only include divider in the vertical layout.
  const divider = (
    <>
      <Media greaterThanOrEqual="3xl">{renderDivider}</Media>
      <Media lessThan="xl">{renderDivider}</Media>
    </>
  );

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
      <MetadataList items={projectItems} />
      {divider}
      <PluginGithubData />
      {divider}
      <MetadataList items={requirementItems} />
    </div>
  );
}
