import { ReactNode } from 'react';

import { AppBarLanding } from '@/components/AppBar';
import { Banner } from '@/components/Banner';
import { Footer } from '@/components/Footer';

interface Props {
  children: ReactNode;
}

export function HomePageLayout({ children }: Props) {
  return (
    <div className="flex flex-col">
      <Banner />
      <AppBarLanding />
      <div className="flex-grow min-h-screen">{children}</div>
      {/* Disabling for now because HubSpot drops cookies */}
      {/* <SignupForm variant="home" /> */}
      <Footer />
    </div>
  );
}
