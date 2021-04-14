import { render, waitFor } from '@testing-library/react';
import { ComponentProps } from 'react';

import { Overlay } from './Overlay';

function renderOverlay(props: ComponentProps<typeof Overlay> = {}) {
  const component = render(<Overlay {...props} />);
  return component.getByTestId('overlay');
}

describe('<Overlay />', () => {
  it('should render nothing when visible=false', () => {
    expect(renderOverlay).toThrow();
  });

  it('should render overlay when visible=true', async () => {
    const overlay = renderOverlay({ visible: true });
    await waitFor(() => {
      expect(overlay).toBeVisible();
    });
  });
});
