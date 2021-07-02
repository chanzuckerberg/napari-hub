import { render } from '@testing-library/react';

import { SearchBar } from './SearchBar';

describe('<SearchBar />', () => {
  it('should match snapshot', () => {
    const component = render(<SearchBar />);
    expect(component.asFragment()).toMatchSnapshot();
  });
});
