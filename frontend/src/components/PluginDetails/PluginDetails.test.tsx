import { render, screen } from '@testing-library/react';

import { PluginStateProvider } from '@/context/plugin';
import napariPlugin from '@/fixtures/napari.json';
import { SearchStoreProvider } from '@/store/search/context';

import { PluginDetails } from './PluginDetails';

describe('<PluginDetails />', () => {
  it('should match snapshot', () => {
    render(
      <SearchStoreProvider skipInit>
        <PluginStateProvider
          plugin={napariPlugin}
          repo={{
            forks: 0,
            issuesAndPRs: 0,
            stars: 0,
          }}
        >
          <PluginDetails />
        </PluginStateProvider>
        ,
      </SearchStoreProvider>,
    );
    expect(screen.getByTestId('pluginDetails')).toMatchSnapshot();
  });
});
