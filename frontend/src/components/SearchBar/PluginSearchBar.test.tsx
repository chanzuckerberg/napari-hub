import { render } from '@testing-library/react';

import { SearchStoreProvider } from '@/store/search/context';

import { PluginSearchBar } from './PluginSearchBar';

describe('<PluginSearchBar />', () => {
  it('should match snapshot', () => {
    const component = render(
      <SearchStoreProvider>
        <PluginSearchBar />
      </SearchStoreProvider>,
    );
    expect(component.asFragment()).toMatchSnapshot();
  });
});
