import FormLabel from '@material-ui/core/FormLabel';

import { Accordion } from '@/components/common/Accordion';
import { Media } from '@/components/common/media';
import { FilterKey } from '@/store/search/form.store';

import { PluginComplexFilter } from './PluginComplexFilter';

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm() {
  const filters: FilterKey[] = [
    'pythonVersions',
    'operatingSystems',
    'license',
  ];

  return (
    <div className="grid grid-cols-1 screen-600:grid-cols-2 screen-875:grid-cols-1">
      {/* Only show label on larger screens. This is because the Accordion already includes a title. */}
      <Media greaterThanOrEqual="screen-875">
        <FormLabel
          className="uppercase text-black font-semibold text-sm"
          component="legend"
          focused={false}
        >
          Filter by requirement
        </FormLabel>
      </Media>

      {filters.map((filterKey) => (
        <PluginComplexFilter key={filterKey} filterKey={filterKey} />
      ))}
    </div>
  );
}

/**
 * Renders the plugin filter by requirements form. For smaller screen sizes (<
 * 875px), an expandable accordion layout is used. For larger screens, the
 * filter form is rendered as-is.
 */
export function PluginFilterByRequirementForm() {
  const form = <FilterForm />;

  return (
    <>
      <Media lessThan="screen-875">
        <Accordion title="Filter by requirement">{form}</Accordion>
      </Media>

      <Media greaterThanOrEqual="screen-875">{form}</Media>
    </>
  );
}
