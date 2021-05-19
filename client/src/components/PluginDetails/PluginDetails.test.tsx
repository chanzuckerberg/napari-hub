import { render, screen } from '@testing-library/react';

import { PluginStateProvider } from '@/context/plugin';
import napariPlugin from '@/fixtures/napari.json';

import { PluginDetails } from './PluginDetails';

describe('<PluginDetails />', () => {
  it('should match snapshot', () => {
    render(
      <PluginStateProvider plugin={napariPlugin}>
        <PluginDetails />
      </PluginStateProvider>,
    );
    expect(screen.getByTestId('pluginDetails')).toMatchSnapshot();
  });
});
