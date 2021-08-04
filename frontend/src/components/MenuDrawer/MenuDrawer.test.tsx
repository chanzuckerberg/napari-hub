import { fireEvent, render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import { LinkInfo } from '@/types';

import { MenuDrawer } from './MenuDrawer';

const noop = () => {};

describe('<MenuDrawer />', () => {
  const mockItems: LinkInfo[] = [
    {
      title: 'foo',
      link: '/foo',
    },
    {
      title: 'bar',
      link: '/bar',
    },
  ];

  type Props = ComponentProps<typeof MenuDrawer>;

  const renderComponent = ({
    items = mockItems,
    onClose = noop,
    onOpen = noop,
    visible = true,
  }: Partial<Props> = {}) => {
    const props = {
      items,
      onClose,
      onOpen,
      visible,
    } as Props;

    return render(<MenuDrawer {...props} />);
  };

  it('should match snapshot', () => {
    renderComponent({ visible: true });
    const menu = screen.getByTestId('menu');
    expect(menu).toMatchSnapshot();
  });

  it('should render items', () => {
    renderComponent({ visible: true });
    const items = screen.getAllByTestId('drawerItem');

    items.forEach((item, index) => {
      const link = item.querySelector('a');
      expect(link).toHaveTextContent(mockItems[index].title);
      expect(link).toHaveAttribute('href', mockItems[index].link);
    });
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderComponent({ onClose, visible: true });

    const closeButton = screen.getByTestId('drawerClose');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
