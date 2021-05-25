import { useSearchState } from '@/context/search';

/**
 * Renders a JSON string of the search state. This should be replaced with the
 * actual sort and filter components.
 */
export function PluginSearchControls() {
  const state = useSearchState();

  const stateReport = {
    filter: state?.filter.state,
    search: state?.search.query,
    sort: state?.sort.sortType,
  };

  return (
    <div className="flex flex-col row-span-4 gap-6">
      <p>TODO search filters</p>

      <pre className="overflow-x-auto text-xs">
        {JSON.stringify(stateReport, null, 2)}
      </pre>
    </div>
  );
}
