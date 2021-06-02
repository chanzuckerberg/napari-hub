import { render } from '@testing-library/react';
import { ComponentProps } from 'react';

import { TextHighlighter } from './TextHighlighter';

function renderComponent(
  props: Partial<ComponentProps<typeof TextHighlighter>> = {},
) {
  return render(
    <TextHighlighter words={['world']} {...props}>
      hello world
    </TextHighlighter>,
  );
}

describe('<TextHighlighter />', () => {
  it('should match snapshot', () => {
    const component = renderComponent();
    expect(component.asFragment()).toMatchSnapshot('with highlighting');
  });

  it('should not render highlighting when disabled', () => {
    const component = renderComponent({ disabled: true });
    expect(component.asFragment()).toMatchSnapshot('no highlighting');
  });
});
