import { FormLabel } from '@material-ui/core';

import { Accordion } from '@/components/common';
import { Media } from '@/components/common/media';

import { PluginFilterBySection } from './PluginFilterBySection';

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm() {
  return (
    <div className="flex flex-col gap-6">
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
      <PluginFilterBySection
        title="Python versions"
        filters={[
          {
            label: '3.6',
            enabled: true,
            setEnabled: (enabled: boolean) => enabled,
          },
          {
            label: '3.7',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
          {
            label: '3.8',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
          {
            label: '3.9',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
        ]}
      />
      <PluginFilterBySection
        title="Operating system"
        filters={[
          {
            label: 'Linux',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
          {
            label: 'Mac',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
          {
            label: 'Windows',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
        ]}
      />
      <PluginFilterBySection
        title="Development status"
        filters={[
          {
            label: 'Only show stable plugins',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
        ]}
      />
      <PluginFilterBySection
        title="License"
        filters={[
          {
            label: 'Only show plugins with open source license',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
        ]}
      />
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
