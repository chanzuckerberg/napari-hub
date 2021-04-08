import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <>
      <main>{children}</main>
    </>
  );
}
