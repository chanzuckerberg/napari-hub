import { ReactNode } from 'react';

import { AppBar } from '@/components/AppBar';
import { Banner } from '@/components/Banner';
import { Footer } from '@/components/Footer';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  // const router = useRouter();
  // const isSearchPage = router.pathname === '/plugins';

  return (
    <div className="flex flex-col min-h-screen">
      <Banner />
      <AppBar />

      <main className="flex flex-col flex-grow">{children}</main>
      {/* Disabling for now because HubSpot drops cookies */}
      {/* <SignupForm variant={isSearchPage ? 'search' : 'default'} /> */}
      <Footer />
    </div>
  );
}
