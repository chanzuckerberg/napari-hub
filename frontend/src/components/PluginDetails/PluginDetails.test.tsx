import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';

import napariPlugin from '@/fixtures/napari.json';
import { DEFAULT_REPO_STATE, pluginState, repoState } from '@/store/plugin';

import { PluginDetails } from './PluginDetails';

describe('<PluginDetails />', () => {
  it('should match snapshot', () => {
    render(
      <Provider
        initialValues={[
          [pluginState, napariPlugin],
          [repoState, DEFAULT_REPO_STATE],
        ]}
      >
        <PluginDetails />
      </Provider>,
    );
    expect(screen.getByTestId('pluginDetails')).toMatchSnapshot();
  });
});
