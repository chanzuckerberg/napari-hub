import { render } from '@testing-library/react';

import { TableOfContents } from './TableOfContents';

describe('Table of Contents', () => {
  it('should match snapshot', () => {
    const { asFragment } = render(
      <TableOfContents
        headers={[
          { id: 'one', text: 'One' },
          { id: 'two', text: 'Two' },
        ]}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  // TODO: test highlighting
});
