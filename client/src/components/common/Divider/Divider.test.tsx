import { render } from '@testing-library/react';

import { Divider } from './Divider';

describe('<Divider />', () => {
  it('should match snapshot', () => {
    const component = render(<Divider />);
    expect(component).toMatchSnapshot();
  });
});
