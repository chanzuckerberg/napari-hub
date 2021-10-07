import { fireEvent, render, screen } from '@testing-library/react';

import { Pagination } from './Pagination';

function clickPageButton(testId: string) {
  fireEvent(
    screen.getByTestId(testId),
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe('<Pagination />', () => {
  it('should match snapshot', () => {
    const component = render(<Pagination page={1} totalPages={10} />);
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should update page value', () => {
    const { getByTestId, rerender } = render(
      <Pagination page={1} totalPages={10} />,
    );
    expect(getByTestId('paginationValue')).toHaveTextContent('1/10');

    rerender(<Pagination page={5} totalPages={10} />);
    expect(getByTestId('paginationValue')).toHaveTextContent('5/10');
  });

  it('should call onNextPage and onPrevPage', () => {
    const onNextPage = jest.fn();
    const onPrevPage = jest.fn();
    render(
      <Pagination
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        page={5}
        totalPages={10}
      />,
    );

    expect(onNextPage).not.toHaveBeenCalled();
    expect(onPrevPage).not.toHaveBeenCalled();

    clickPageButton('paginationLeft');
    clickPageButton('paginationRight');

    expect(onNextPage).toHaveBeenCalled();
    expect(onPrevPage).toHaveBeenCalled();
  });

  it('should not call onNextPage at beginning page', () => {
    const onNextPage = jest.fn();
    render(<Pagination onNextPage={onNextPage} page={1} totalPages={10} />);
    clickPageButton('paginationLeft');
    expect(onNextPage).not.toHaveBeenCalled();
  });

  it('should not call onPrevPage at ending page', () => {
    const onPrevPage = jest.fn();
    render(<Pagination onPrevPage={onPrevPage} page={10} totalPages={10} />);
    clickPageButton('paginationRight');
    expect(onPrevPage).not.toHaveBeenCalled();
  });
});
