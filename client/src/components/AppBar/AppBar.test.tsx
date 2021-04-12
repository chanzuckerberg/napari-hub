import { render } from '@testing-library/react';

import { AppBar } from './AppBar';

describe('<AppBar />', () => {
  it('should match snapshot', () => {
    const component = render(<AppBar />);
    expect(component.asFragment()).toMatchSnapshot();
  });
});
