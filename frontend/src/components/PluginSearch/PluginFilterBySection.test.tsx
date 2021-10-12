import { fireEvent, render } from '@testing-library/react';
import { zip } from 'lodash';

import { FilterItem, PluginFilterBySection } from './PluginFilterBySection';

describe('Plugin filter-by section', () => {
  it('should accept title and filter parameters', () => {
    const title = 'My Title';
    const filters: FilterItem[] = [
      {
        label: 'one',
        filterKey: 'filter',
        stateKey: 'state1',
        useFilterState: jest.fn().mockReturnValue(true),
        setFilterState: jest.fn(),
      },
      {
        label: 'two',
        filterKey: 'filter',
        stateKey: 'state2',
        useFilterState: jest.fn().mockReturnValue(false),
        setFilterState: jest.fn(),
      },
    ];
    const expectedChecked: Record<string, boolean> = {
      one: true,
      two: false,
    };

    const { getByTestId, getAllByTestId } = render(
      <PluginFilterBySection title={title} filters={filters} />,
    );

    expect(getByTestId('filterCheckboxTitle').innerHTML).toBe(title);

    const filterCheckboxes = getAllByTestId('filterCheckbox');

    expect(filterCheckboxes).toHaveLength(filters.length);

    (
      zip(filters, filterCheckboxes) as Array<[FilterItem, HTMLElement]>
    ).forEach(([filter, input]) => {
      expect(input.lastElementChild?.innerHTML).toBe(filter.label);
      expect(filter.useFilterState).toHaveBeenLastCalledWith();
      expect(input.querySelector('input')?.checked).toBe(
        expectedChecked[filter.label],
      );
    });
  });

  it('should call setEnabled when checked', () => {
    const filters: FilterItem[] = [
      {
        label: 'one',
        filterKey: 'filter',
        stateKey: 'state1',
        useFilterState: jest.fn().mockReturnValue(false),
        setFilterState: jest.fn(),
      },
      {
        label: 'two',
        filterKey: 'filter',
        stateKey: 'state2',
        useFilterState: jest.fn().mockReturnValue(true),
        setFilterState: jest.fn(),
      },
    ];
    const expectedChecked: Record<string, boolean> = {
      one: true,
      two: false,
    };

    const { getAllByTestId } = render(
      <PluginFilterBySection title="test" filters={filters} />,
    );

    const filterCheckboxes = getAllByTestId('filterCheckbox');

    expect(filterCheckboxes).toHaveLength(filters.length);

    (
      zip(filters, filterCheckboxes) as Array<[FilterItem, HTMLElement]>
    ).forEach(([filter, input]) => {
      const checkbox = input.querySelector('input');
      expect(checkbox).not.toBeUndefined();
      fireEvent.click(checkbox as HTMLElement);
      expect(filter.setFilterState).toHaveBeenCalledWith(
        expectedChecked[filter.label],
      );
    });
  });
});
