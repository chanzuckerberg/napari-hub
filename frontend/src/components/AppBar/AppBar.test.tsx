import { render } from '@testing-library/react';

import { SearchStoreProvider } from '@/store/search/context';

import { AppBar } from './AppBar';

describe('<AppBar />', () => {
  it('should match snapshot', () => {
    const component = render(
      <SearchStoreProvider>
        <AppBar />
      </SearchStoreProvider>,
    );
    expect(component.asFragment()).toMatchSnapshot();
  });
});
