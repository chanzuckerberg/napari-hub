import { render, RenderResult, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { Layout } from './Layout';

describe('<Layout />', () => {
  const text = 'Hello, World!';
  let component: RenderResult;
  let child: ReactNode;

  beforeEach(() => {
    child = <h1>{text}</h1>;
    component = render(<Layout>{child}</Layout>);
  });

  it('should match snapshot', () => {
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should render child', () => {
    const renderedChild = screen.getByText(text);
    expect(renderedChild).toBeTruthy();
  });
});
