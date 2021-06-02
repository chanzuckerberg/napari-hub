import { fireEvent, render, screen } from '@testing-library/react';

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

    for (let i = 0; i < filters.length; i += 1) {
      const filter = filters[i];
      const input = inputs[i];

      expect(input.lastElementChild?.innerHTML).toBe(filter.label);
      expect(input.querySelector('input')?.checked).toBe(filter.enabled);
    }
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

    for (let i = 0; i < filters.length; i += 1) {
      const filter = filters[i];
      const input = inputs[i];

      const checkbox = input.querySelector('input');
      expect(checkbox).not.toBeUndefined();
      fireEvent.click(checkbox as HTMLElement);
      expect(filter.setEnabled).toHaveBeenCalledWith(!filter.enabled);
    }
  });
});
