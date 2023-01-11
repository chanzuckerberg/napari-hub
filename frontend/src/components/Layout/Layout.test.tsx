import { render, RenderResult, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { SearchStoreProvider } from '@/store/search/context';

import { Layout } from './Layout';

jest.mock('hast-util-sanitize', () => ({
  defaultSchema: {
    attributes: {},
  },
}));

jest.mock('react-markdown', () => ({
  __default: jest.fn().mockReturnValue(() => <></>),
}));

jest.mock('rehype-raw', () => ({
  __default: jest.fn(),
}));

jest.mock('rehype-sanitize', () => ({
  __default: jest.fn(),
}));

jest.mock('rehype-slug', () => ({
  __default: jest.fn(),
}));

jest.mock('rehype-stringify', () => ({
  __default: jest.fn(),
}));

jest.mock('remark-external-links', () => ({
  __default: jest.fn(),
}));

jest.mock('remark-gfm', () => ({
  __default: jest.fn(),
}));

jest.mock('remark-parse', () => ({
  __default: jest.fn(),
}));

jest.mock('remark-rehype', () => ({
  __default: jest.fn(),
}));

jest.mock('unified', () => ({
  unified: jest.fn(),
}));

describe('<Layout />', () => {
  const text = 'Hello, World!';
  let component: RenderResult;
  let child: ReactNode;

  beforeEach(() => {
    child = <h1>{text}</h1>;
    component = render(
      <SearchStoreProvider>
        <Layout>{child}</Layout>
      </SearchStoreProvider>,
    );
  });

  it('should match snapshot', () => {
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should render child', () => {
    const renderedChild = screen.getByText(text);
    expect(renderedChild).toBeTruthy();
  });
});
