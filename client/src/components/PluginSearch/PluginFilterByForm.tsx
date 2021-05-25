import { Accordion } from '@/components/common';
import { MediaFragment } from '@/components/common/media';

/**
 * Component for the radio form for selecting the plugin sort type.
 */
function FilterForm() {
  return (
    <>
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
