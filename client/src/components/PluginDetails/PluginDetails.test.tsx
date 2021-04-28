import { render, screen } from '@testing-library/react';

import napariPlugin from '@/fixtures/napari.json';

import { PluginDetails } from './PluginDetails';

describe('<PluginDetails />', () => {
  it('should match snapshot', () => {
    render(<PluginDetails plugin={napariPlugin} />);
    expect(screen.getByTestId('pluginDetails')).toMatchSnapshot();
  });
});
