import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import { AppBar } from '@/components/AppBar';
import { Banner } from '@/components/Banner';
import { Footer } from '@/components/Footer';
import { SignupForm } from '@/components/SignupForm';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const router = useRouter();
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');
  const isSearchPage = isHomePageRedesign && router.pathname === '/plugins';

  return (
    <div className="flex flex-col min-h-screen">
      <Banner />
      {!process.env.PREVIEW && <AppBar />}

      <main className="flex flex-col flex-grow">{children}</main>
      <SignupForm variant={isSearchPage ? 'search' : 'default'} />
      <Footer />
    </div>
  );
}
