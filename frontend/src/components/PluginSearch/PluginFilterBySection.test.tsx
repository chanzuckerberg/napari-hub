import { fireEvent, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { atom, useAtom } from 'jotai';
import { zip } from 'lodash';

import { FilterItem, PluginFilterBySection } from './PluginFilterBySection';

describe('Plugin filter-by section', () => {
  it('should accept title and filter parameters', () => {
    const title = 'My Title';
    const filters: FilterItem[] = [
      {
        label: 'one',
        state: atom<boolean>(false),
      },
      {
        label: 'two',
        state: atom<boolean>(true),
      },
    ];

    const { getByTestId, getAllByTestId } = render(
      <PluginFilterBySection title={title} filters={filters} />,
    );

    expect(getByTestId('filterCheckboxTitle').innerHTML).toBe(title);

    const filterCheckboxes = getAllByTestId('filterCheckbox');

    expect(filterCheckboxes).toHaveLength(filters.length);

    (zip(filters, filterCheckboxes) as Array<
      [FilterItem, HTMLElement]
    >).forEach(([filter, input]) => {
      expect(input.lastElementChild?.innerHTML).toBe(filter.label);
      const { result: expected } = renderHook(() => useAtom(filter.state));
      expect(input.querySelector('input')?.checked).toBe(expected.current[0]);
    });
  });

  it('should update state when checked', () => {
    const filters: FilterItem[] = [
      {
        label: 'one',
        state: atom<boolean>(false),
      },
      {
        label: 'two',
        state: atom<boolean>(false),
      },
    ];

    const { getAllByTestId } = render(
      <PluginFilterBySection title="test" filters={filters} />,
    );

    const filterCheckboxes = getAllByTestId('filterCheckbox');

    expect(filterCheckboxes).toHaveLength(filters.length);

    (zip(filters, filterCheckboxes) as Array<
      [FilterItem, HTMLElement]
    >).forEach(([filter, input]) => {
      const checkbox = input.querySelector('input');
      expect(checkbox).not.toBeUndefined();
      fireEvent.click(checkbox as HTMLElement);

      const { result } = renderHook(() => useAtom(filter.state));
      expect(result.current[0]).toBe(true);
    });
  });
});
