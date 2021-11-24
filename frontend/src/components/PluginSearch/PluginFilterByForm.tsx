import { Accordion } from '@/components/common/Accordion';
import { Media } from '@/components/common/media';
import { FilterKey } from '@/store/search/search.store';

import { PluginComplexFilter } from './PluginComplexFilter';

interface Props {
  filters: FilterKey[];
  label: string;
}

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm({ filters, label }: Props) {
  return (
    <div className="grid grid-cols-1 screen-600:grid-cols-2 screen-875:grid-cols-1 space-y-4">
      {/* Only show label on larger screens. This is because the Accordion already includes a title. */}
      <Media greaterThanOrEqual="screen-875">
        <legend className="uppercase text-black font-semibold text-sm">
          {label}
        </legend>
      </Media>

      <div className="flex flex-col col-span-2 space-y-2">
        {filters.map((filterKey) => (
          <PluginComplexFilter key={filterKey} filterKey={filterKey} />
        ))}
      </div>
    </div>
  );
}

/**
 * Renders a form for plugin filter. For smaller screen sizes (< 875px), an
 * expandable accordion layout is used. For larger screens, the filter form is
 * rendered as-is.
 */
export function PluginFilterByForm(props: Props) {
  const form = <FilterForm {...props} />;
  const { label } = props;

  return (
    <>
      <Media lessThan="screen-875">
        <Accordion title={label}>{form}</Accordion>
      </Media>

      <Media greaterThanOrEqual="screen-875">{form}</Media>
    </>
  );
}
