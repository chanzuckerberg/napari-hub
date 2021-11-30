import { render } from '@testing-library/react';

import { SearchStoreProvider } from '@/store/search/context';

import { SearchBar } from './SearchBar';

describe('<SearchBar />', () => {
  it('should match snapshot', () => {
    const component = render(
      <SearchStoreProvider>
        <SearchBar />
      </SearchStoreProvider>,
    );
    expect(component.asFragment()).toMatchSnapshot();
  });
});
