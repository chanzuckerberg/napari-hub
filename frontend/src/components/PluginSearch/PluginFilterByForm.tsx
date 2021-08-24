import { Accordion, SkeletonLoader } from '@/components/common';
import { Media } from '@/components/common/media';
import {
  OPERATING_SYSTEM_LABEL_ENTRIES,
  PYTHON_LABEL_ENTRIES,
} from '@/constants/filter';
import {
  filterLinuxState,
  filterMacState,
  filterOnlyOpenSourcePluginsState,
  filterOnlyStablePluginsState,
  filterPython37State,
  filterPython38State,
  filterPython39State,
  filterWindowsState,
} from '@/store/search/filter.state';
import { getStateLabelEntries } from '@/utils';

import { PluginFilterBySection } from './PluginFilterBySection';

export const SECTION_LABELS = getStateLabelEntries(
  // Python version labels.
  ...PYTHON_LABEL_ENTRIES,

  // Operating system labels.
  ...OPERATING_SYSTEM_LABEL_ENTRIES,

  // Development status labels.
  { label: 'Only show stable plugins', state: filterOnlyStablePluginsState },

  // License labels.
  {
    label: 'Only show plugins with open source licenses',
    state: filterOnlyOpenSourcePluginsState,
  },
);

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm() {
  const sections = [
    {
      title: 'Python versions',
      states: [filterPython37State, filterPython38State, filterPython39State],
    },
    {
      title: 'Operating system',
      states: [filterLinuxState, filterMacState, filterWindowsState],
    },
    // TODO Uncomment when we figure out what to do with the dev status filter
    {
      title: 'Development status',
      states: [filterOnlyStablePluginsState],
    },
    {
      title: 'License',
      states: [filterOnlyOpenSourcePluginsState],
    },
  ];

  return (
    <div className="grid grid-cols-1 screen-600:grid-cols-2 screen-875:grid-cols-1">
      {/* Only show label on larger screens. This is because the Accordion already includes a title. */}
      <Media greaterThanOrEqual="screen-875">
        <legend className="uppercase text-black font-semibold text-sm">
          Filter By
        </legend>
      </Media>

      {sections.map((section) => (
        <PluginFilterBySection
          className="mt-6"
          key={section.title}
          title={section.title}
          filters={section.states.map((state) => ({
            state,
            label: SECTION_LABELS.get(state) ?? '',
          }))}
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
        <SkeletonLoader
          className="h-12 mt-6"
          render={() => <Accordion title="Filter By">{form}</Accordion>}
        />
      </Media>

      <Media greaterThanOrEqual="screen-875">
        <SkeletonLoader className="h-[400px]" render={() => form} />
      </Media>
    </>
  );
}
