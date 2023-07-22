import { fireEvent, render } from '@testing-library/react';

import { SearchBar } from './SearchBar';

describe('<SearchBar />', () => {
  it('should match snapshot', () => {
    const component = render(
      <SearchBar value="" onSubmit={() => {}} onChange={() => {}} />,
    );
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should match snapshot when large=true', () => {
    const component = render(
      <SearchBar value="" onSubmit={() => {}} onChange={() => {}} large />,
    );
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should update on type when changeOnSubmit=false', async () => {
    const onChange = jest.fn();
    const component = render(
      <SearchBar value="" onSubmit={() => {}} onChange={onChange} />,
    );

    const input = await component.findByTestId('searchBarInput');
    fireEvent.change(input, { target: { value: '123' } });
    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('should update on form submit when changeOnSubmit=true', async () => {
    const onChange = jest.fn();
    const component = render(
      <SearchBar
        value=""
        onSubmit={() => {}}
        onChange={onChange}
        changeOnSubmit
      />,
    );

    const input = await component.findByTestId('searchBarInput');
    fireEvent.change(input, { target: { value: '123' } });
    expect(onChange).not.toHaveBeenCalled();

    const form = await component.findByTestId('searchBarForm');
    fireEvent.submit(form);
    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('should update on button click when changeOnSubmit=true', async () => {
    const onChange = jest.fn();
    const component = render(
      <SearchBar
        value=""
        onSubmit={() => {}}
        onChange={onChange}
        changeOnSubmit
      />,
    );

    const input = await component.findByTestId('searchBarInput');
    fireEvent.change(input, { target: { value: '123' } });
    expect(onChange).not.toHaveBeenCalled();

    const button = await component.findByTestId('submitQueryButton');
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('should clear query on clear button click when changeOnSubmit=false', async () => {
    const onChange = jest.fn();
    const component = render(
      <SearchBar value="123" onSubmit={() => {}} onChange={onChange} />,
    );

    const button = await component.findByTestId('clearQueryButton');
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should clear query on clear button click when changeOnSubmit=true', async () => {
    const onChange = jest.fn();
    const component = render(
      <SearchBar
        value="123"
        onSubmit={() => {}}
        onChange={onChange}
        changeOnSubmit
      />,
    );

    const button = await component.findByTestId('clearQueryButton');
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should submit query when changeOnSubmit=false', async () => {
    const onSubmit = jest.fn();
    const component = render(
      <SearchBar value="123" onSubmit={onSubmit} onChange={() => {}} />,
    );

    const form = await component.findByTestId('searchBarForm');
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledWith('123');
  });

  it('should submit query when changeOnSubmit=true', async () => {
    const onSubmit = jest.fn();
    const component = render(
      <SearchBar
        value=""
        onSubmit={onSubmit}
        onChange={() => {}}
        changeOnSubmit
      />,
    );

    const input = await component.findByTestId('searchBarInput');
    fireEvent.change(input, { target: { value: '123' } });

    const button = await component.findByTestId('submitQueryButton');
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith('123');
  });
});
