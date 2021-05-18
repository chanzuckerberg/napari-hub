import { ReactNode } from 'react';

import { AppBar, Footer, SignupForm } from '@/components';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <>
      <AppBar />
      <main>{children}</main>
      <SignupForm />
      <Footer />
    </>
  );
}
