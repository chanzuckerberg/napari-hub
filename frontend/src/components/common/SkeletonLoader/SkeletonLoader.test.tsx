import { render } from '@testing-library/react';
import { Provider } from 'jotai';

import { loadingState } from '@/store/loading';

import { SkeletonLoader } from './SkeletonLoader';

describe('<SkeletonLoader />', () => {
  const text = 'Hello, World!';

  it('should match snapshot', () => {
    let component = render(<SkeletonLoader render={() => <h1>{text}</h1>} />);
    expect(component.asFragment()).toMatchSnapshot();

    component = render(<SkeletonLoader render={() => <h1>{text}</h1>} />);
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should render skeleton when loading', () => {
    const component = render(
      <Provider initialValues={[[loadingState, true]]}>
        <SkeletonLoader render={() => <h1>{text}</h1>} />
      </Provider>,
    );

    expect(component.getByTestId('skeleton-loader')).toBeDefined();
  });
});
