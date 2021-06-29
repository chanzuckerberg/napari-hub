import { FormLabel } from '@material-ui/core';

import { Accordion } from '@/components/common';
import { Media } from '@/components/common/media';
import { useSearchState } from '@/context/search';

import { PluginFilterBySection } from './PluginFilterBySection';

const SECTION_LABELS: Record<string, string | undefined> = {
  // Operating System
  linux: 'Linux',
  mac: 'macOS',
  windows: 'Windows',

  // Development Status
  onlyStablePlugins: 'Only show stable plugins',

  // License
  onlyOpenSourcePlugins: 'Only show plugins with open source licenses',
};

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm() {
  const { filter } = useSearchState() ?? {};
  const sections = [
    {
      title: 'Python versions',
      state: filter?.state.pythonVersions,
      setState: filter?.setPythonVersion,
    },
    {
      title: 'Operating system',
      state: filter?.state.operatingSystems,
      setState: filter?.setOperatingSystem,
    },
    // TODO Uncomment when we figure out what to do with the dev status filter
    // {
    //   title: 'Development status',
    //   state: filter?.state.developmentStatus,
    //   setState: filter?.setDevelopmentStatus,
    // },
    {
      title: 'License',
      state: filter?.state.license,
      setState: filter?.setLicense,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 screen-600:grid-cols-2 screen-875:grid-cols-1">
      {/* Only show label on larger screens. This is because the Accordion already includes a title. */}
      <Media greaterThanOrEqual="screen-875">
        <FormLabel
          className="uppercase text-black font-semibold text-sm"
          component="legend"
          focused={false}
        >
          Filter By
        </FormLabel>
      </Media>

      {sections.map((section) => (
        <PluginFilterBySection
          key={section.title}
          title={section.title}
          filters={Object.entries(section.state ?? {}).map(
            ([key, enabled]: [string, boolean]) => ({
              enabled,
              label: SECTION_LABELS[key] ?? key,
              setEnabled: (nextEnabled: boolean) =>
                section.setState?.({ [key]: nextEnabled }),
            }),
          )}
        />
      ))}
    </div>
  );
}

/**
 * Renders the plugin filter form. For smaller screen sizes (< 875px), an
 * expandable accordion layout is used. For larger screens, the filter form is
 * rendered as-is.
 */
export function PluginFilterByForm() {
  const form = <FilterForm />;

  return (
    <>
      <Media lessThan="screen-875">
        <Accordion title="Filter By">{form}</Accordion>
      </Media>

      <Media greaterThanOrEqual="screen-875">{form}</Media>
    </>
  );
}
