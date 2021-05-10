import { render, screen } from '@testing-library/react';
import timezoneMock from 'timezone-mock';

import { PluginStateProvider } from '@/context/plugin';
import napariPlugin from '@/fixtures/napari.json';

import { PluginDetails } from './PluginDetails';

describe('<PluginDetails />', () => {
  // Mock timezone to have consistent test results in CI.
  beforeAll(() => {
    timezoneMock.register('US/Pacific');
  });

  afterAll(() => {
    timezoneMock.unregister();
  });

  it('should match snapshot', () => {
    render(
      <PluginStateProvider plugin={napariPlugin}>
        <PluginDetails />
      </PluginStateProvider>,
    );
    expect(screen.getByTestId('pluginDetails')).toMatchSnapshot();
  });
});
