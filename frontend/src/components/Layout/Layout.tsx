import { ReactNode } from 'react';

import { AppBar } from '@/components/AppBar';
import { Banner } from '@/components/Banner';
import { Footer } from '@/components/Footer';
import { SignupForm } from '@/components/SignupForm';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      {!process.env.PREVIEW && <AppBar />}
      <Banner />

      <main className="flex flex-col flex-grow">{children}</main>
      <SignupForm />
      <Footer />
    </div>
  );
}
