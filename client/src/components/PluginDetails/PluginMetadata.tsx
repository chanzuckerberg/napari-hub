import { Divider } from '@/components/common';
import { formatDate } from '@/utils/date';

import { MetadataList } from './MetadataList';
import { MetadataItem } from './PluginDetails.types';
import { usePluginState } from './PluginStateContext';

/**
 * Component for rendering plugin GitHub data.
 *
 * TODO Replace this with actual GitHub data.
 */
function PluginGithubData() {
  const items = [
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
    <div className="text-sm">
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

/**
 * Component for rendering plugin metadata sidebar in the plugin details page.
 *
 * TODO Replace with actual plugin data.
 */
export function PluginMetadata() {
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
    <>
      <MetadataList items={projectItems} />
      <Divider className="my-4" />
      <PluginGithubData />
      <Divider className="my-4" />
      <MetadataList items={requirementItems} />
    </>
  );
}
