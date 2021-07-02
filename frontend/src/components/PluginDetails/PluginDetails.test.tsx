import { render, screen } from '@testing-library/react';

import { PluginStateProvider } from '@/context/plugin';
import napariPlugin from '@/fixtures/napari.json';

import { PluginDetails } from './PluginDetails';

describe('<PluginDetails />', () => {
  it('should match snapshot', () => {
    render(
      <PluginStateProvider
        plugin={napariPlugin}
        repo={{
          forks: 0,
          issuesAndPRs: 0,
          stars: 0,
        }}
      >
        <PluginDetails />
      </PluginStateProvider>,
    );
    expect(screen.getByTestId('pluginDetails')).toMatchSnapshot();
  });
});
