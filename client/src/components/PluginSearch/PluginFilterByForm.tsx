import { FormLabel } from '@material-ui/core';

import { Accordion } from '@/components/common';
import { MediaFragment } from '@/components/common/media';

import { PluginFilterBySection } from './PluginFilterBySection';

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm() {
  return (
    <>
      {/* Only show label on larger screens. This is because the Accordion already includes a title. */}
      <MediaFragment greaterThanOrEqual="screen-875">
        <FormLabel
          className="uppercase text-black font-semibold text-sm mb-2"
          component="legend"
          focused={false}
        >
          Filter By
        </FormLabel>
      </MediaFragment>
      <PluginFilterBySection
        title="Test"
        filters={[
          {
            label: 'one',
            enabled: true,
            setEnabled: (enabled: boolean) => enabled,
          },
          {
            label: 'two',
            enabled: false,
            setEnabled: (enabled: boolean) => enabled,
          },
        ]}
      />
      {/* TODO Add filter by python versions */}
      {/* TODO Add filter by operating system */}
      {/* TODO Add filter by development status */}
      {/* TODO Add filter by license */}
    </>
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
      <MediaFragment lessThan="screen-875">
        <Accordion title="Filter By">{form}</Accordion>
      </MediaFragment>

      <MediaFragment greaterThanOrEqual="screen-875">{form}</MediaFragment>
    </>
  );
}
