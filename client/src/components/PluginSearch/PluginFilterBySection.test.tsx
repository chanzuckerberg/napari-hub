import { fireEvent, render } from '@testing-library/react';
import { zip } from 'lodash';

import { FilterItem, PluginFilterBySection } from './PluginFilterBySection';

describe('Plugin filter-by section', () => {
  it('should accept title and filter parameters', () => {
    const title = 'My Title';
    const filters: FilterItem[] = [
      {
        label: 'one',
        enabled: false,
        setEnabled: (enabled: boolean) => enabled,
      },
      {
        label: 'two',
        enabled: true,
        setEnabled: (enabled: boolean) => enabled,
      },
    ];

    const { getByTestId, getAllByTestId } = render(
      <PluginFilterBySection title={title} filters={filters} />,
    );

    expect(getByTestId('title').innerHTML).toBe(title);

    const inputs = getAllByTestId('input');

    expect(inputs).toHaveLength(filters.length);

    (zip(filters, inputs) as Array<[FilterItem, HTMLElement]>).forEach(
      ([filter, input]) => {
        expect(input.lastElementChild?.innerHTML).toBe(filter.label);
        expect(input.querySelector('input')?.checked).toBe(filter.enabled);
      },
    );
  });

  it('should call setEnabled when checked', () => {
    const filters: FilterItem[] = [
      {
        label: 'one',
        enabled: false,
        setEnabled: jest.fn(),
      },
      {
        label: 'two',
        enabled: true,
        setEnabled: jest.fn(),
      },
    ];

    const { getAllByTestId } = render(
      <PluginFilterBySection title="test" filters={filters} />,
    );

    const inputs = getAllByTestId('input');

    expect(inputs).toHaveLength(filters.length);

    (zip(filters, inputs) as Array<[FilterItem, HTMLElement]>).forEach(
      ([filter, input]) => {
        const checkbox = input.querySelector('input');
        expect(checkbox).not.toBeUndefined();
        fireEvent.click(checkbox as HTMLElement);
        expect(filter.setEnabled).toHaveBeenCalledWith(!filter.enabled);
      },
    );
  });
});
