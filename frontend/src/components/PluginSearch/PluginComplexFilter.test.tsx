import {
  fireEvent,
  getByText as getByTextFromContainer,
  render,
  screen,
} from '@testing-library/react';

import { SearchStoreProvider } from '@/store/search/context';
import { SearchFilterStore } from '@/store/search/filter.store';
import { PluginSearchStore } from '@/store/search/search.store';

import { PluginComplexFilter } from './PluginComplexFilter';

describe('<PluginComplexFilter />', () => {
  let mockSearchStore: PluginSearchStore;

  function setOsFilterState(
    state: Partial<SearchFilterStore['operatingSystems']>,
  ) {
    Object.assign(mockSearchStore.filters.operatingSystems, state);
  }

  function renderFilter() {
    return render(
      <SearchStoreProvider searchStore={mockSearchStore}>
        <PluginComplexFilter filterKey="operatingSystems" />
      </SearchStoreProvider>,
    );
  }

  beforeEach(() => {
    mockSearchStore = new PluginSearchStore();
  });

  it('should match snapshot', () => {
    setOsFilterState({
      linux: true,
      mac: true,
      windows: true,
    });

    const component = renderFilter();
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should render filter options on initial load', () => {
    setOsFilterState({
      linux: true,
      windows: true,
    });

    const { queryByText } = renderFilter();

    expect(queryByText('Linux')).toBeInTheDocument();
    expect(queryByText('Windows')).toBeInTheDocument();
    expect(queryByText('MacOS')).toBeNull();
  });

  it('should filter when menu item is clicked', () => {
    const { getByTestId } = renderFilter();

    expect(screen.queryByTestId('Windows')).toBeNull();
    expect(screen.queryByTestId('Linux')).toBeNull();

    const pluginFilter = getByTestId('pluginFilter');
    const pluginFilterButton = pluginFilter.querySelector('button');

    // Open menu
    if (pluginFilterButton) {
      fireEvent.click(pluginFilterButton);
    }

    // Click on menu options
    for (const option of ['Windows', 'Linux']) {
      const optionElement = getByTextFromContainer(
        screen.getByRole('tooltip'),
        option,
      );
      fireEvent.click(optionElement);
    }

    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('Linux')).toBeInTheDocument();
  });

  it('should remove filters', () => {
    setOsFilterState({
      linux: true,
      windows: true,
    });

    const { getByText, queryByText } = renderFilter();

    // Click delete icon on the chip.
    const linuxChip = getByText('Linux');
    const deleteButton = linuxChip.parentElement?.querySelector(
      '.MuiChip-deleteIcon',
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    expect(queryByText('Linux')).toBeNull();
  });
});
