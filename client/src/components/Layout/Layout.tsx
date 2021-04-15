import { ReactNode } from 'react';

import { AppBar } from '@/components';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <>
      <AppBar />
      <main>{children}</main>
    </>
  );
}
