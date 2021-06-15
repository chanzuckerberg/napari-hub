import { ReactNode } from 'react';

import { AppBar, Footer, SignupForm } from '@/components';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppBar />
      <main className="flex-grow">{children}</main>
      <SignupForm />
      <Footer />
    </div>
  );
}
