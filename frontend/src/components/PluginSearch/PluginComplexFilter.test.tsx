import {
  fireEvent,
  getByText as getByTextFromContainer,
  render,
  screen,
} from '@testing-library/react';

import { resetState, searchFormStore } from '@/store/search/search.store';

import { PluginComplexFilter } from './PluginComplexFilter';

function renderFilter() {
  return render(<PluginComplexFilter filterKey="operatingSystems" />);
}

describe('<PluginComplexFilter />', () => {
  beforeEach(() => {
    resetState();
  });

  it('should match snapshot', () => {
    searchFormStore.filters.operatingSystems.linux = true;
    searchFormStore.filters.operatingSystems.mac = true;
    searchFormStore.filters.operatingSystems.windows = true;

    const component = renderFilter();
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should render filter options on initial load', () => {
    searchFormStore.filters.operatingSystems.linux = true;
    searchFormStore.filters.operatingSystems.windows = true;

    const { debug, queryByText } = renderFilter();
    debug();

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
    searchFormStore.filters.operatingSystems.linux = true;
    searchFormStore.filters.operatingSystems.windows = true;

    const { getByText, queryByText } = renderFilter();

    // Click delete icon on the chip.
    const linuxChip = getByText('Linux');
    const deleteButton = linuxChip.parentElement?.querySelector(
      '.MuiChip-deleteIcon',
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    expect(searchFormStore.filters.operatingSystems.linux).toBe(false);
    expect(queryByText('Linux')).toBeNull();
  });
});
