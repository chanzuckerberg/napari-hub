import { ReactNode } from 'react';

import { AppBar, Footer, SignupForm } from '@/components';
import { useIsPreview } from '@/hooks';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const isPreview = useIsPreview();

  return (
    <div className="flex flex-col min-h-screen">
      {!isPreview && <AppBar />}

      <main className="flex-grow">{children}</main>
      <SignupForm />
      <Footer />
    </div>
  );
}
