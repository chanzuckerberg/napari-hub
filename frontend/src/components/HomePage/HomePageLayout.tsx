import { ReactNode } from 'react';

import { AppBarLanding } from '@/components/AppBar';
import { Banner } from '@/components/Banner';
import { Footer } from '@/components/Footer';
import { SignupForm } from '@/components/SignupForm';

interface Props {
  children: ReactNode;
}

export function HomePageLayout({ children }: Props) {
  return (
    <div className="flex flex-col">
      <Banner />
      <AppBarLanding />
      <div className="flex-grow min-h-screen">{children}</div>
      <SignupForm variant="home" />
      <Footer />
    </div>
  );
}
