import { render } from '@testing-library/react';

import { Footer } from './Footer';

describe('<Footer />', () => {
  it('should match snapshot', () => {
    const component = render(<Footer />);
    expect(component).toMatchSnapshot();
  });
});
