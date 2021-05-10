import { render } from '@testing-library/react';

import { ColumnLayout } from './ColumnLayout';

function renderLayout() {
  const component = render(
    <ColumnLayout>
      <div />
      <div />
      <div />
    </ColumnLayout>,
  );

  return { component };
}

describe('<ColumnLayout />', () => {
  it('should match snapshot', () => {
    const { component } = renderLayout();
    expect(component.asFragment()).toMatchSnapshot();
  });
});
