import { render } from '@testing-library/react';

import { LoadingStateProvider } from '@/context/loading';

import { SkeletonLoader } from './SkeletonLoader';

describe('<SkeletonLoader />', () => {
  const text = 'Hello, World!';

  it('should match snapshot', () => {
    let component = render(<SkeletonLoader render={() => <h1>{text}</h1>} />);
    expect(component.asFragment()).toMatchSnapshot();

    component = render(
      <LoadingStateProvider loading={false}>
        <SkeletonLoader render={() => <h1>{text}</h1>} />
      </LoadingStateProvider>,
    );
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should render skeleton when loading', () => {
    const component = render(
      <LoadingStateProvider loading>
        <SkeletonLoader render={() => <h1>{text}</h1>} />
      </LoadingStateProvider>,
    );

    expect(component.getByTestId('skeleton-loader')).toBeDefined();
  });
});
