import { render } from '@testing-library/react';

import { ColumnLayout } from './ColumnLayout';

function renderLayout() {
  return render(
    <ColumnLayout>
      <div />
      <div />
      <div />
    </ColumnLayout>,
  );
}

describe('<ColumnLayout />', () => {
  it('should match snapshot', () => {
    const component = renderLayout();
    expect(component.asFragment()).toMatchSnapshot();
  });
});
