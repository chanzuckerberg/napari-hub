import { FormLabel } from '@material-ui/core';
import { get, set } from 'lodash';
import { useSnapshot } from 'valtio';

import { Accordion } from '@/components/common/Accordion';
import { Media } from '@/components/common/media';
import { SearchFormStore, searchFormStore } from '@/store/search/form.store';

import { PluginFilterBySection } from './PluginFilterBySection';

const FILTER_LABELS: Record<string, string | undefined> = {
  // Operating System
  linux: 'Linux',
  mac: 'macOS',
  windows: 'Windows',

  // Development Status
  stable: 'Only show stable plugins',

  // License
  openSource: 'Only show plugins with open source licenses',
};

function getCheckboxFilters(
  filterKey: keyof SearchFormStore['filters'],
  stateKeys: string[],
) {
  return stateKeys.map((stateKey) => ({
    label: FILTER_LABELS[stateKey] ?? stateKey,
    filterKey,
    stateKey,

    useFilterState() {
      const filterState = useSnapshot(searchFormStore).filters;
      return get(filterState, [filterKey, stateKey]) as boolean;
    },

    setFilterState(checked: boolean) {
      set(searchFormStore.filters, [filterKey, stateKey], checked);
    },
  }));
}

/**
 * Component for the form for selecting the plugin filter type.
 */
function FilterForm() {
  const sections = [
    {
      title: 'Python versions',
      filters: getCheckboxFilters('pythonVersions', ['3.7', '3.8', '3.9']),
    },
    {
      title: 'Operating system',
      filters: getCheckboxFilters('operatingSystems', [
        'linux',
        'mac',
        'windows',
      ]),
    },
    // TODO Uncomment when we figure out what to do with the dev status filter
    // {
    //   title: 'Development status',
    //   state: filter?.state.developmentStatus,
    //   setState: filter?.setDevelopmentStatus,
    // },
    {
      title: 'License',
      filters: getCheckboxFilters('license', ['openSource']),
    },
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
          Filter By
        </FormLabel>
      </Media>

      {sections.map((section) => (
        <PluginFilterBySection
          className="mt-6"
          key={section.title}
          title={section.title}
          filters={section.filters}
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
