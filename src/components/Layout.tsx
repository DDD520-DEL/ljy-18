import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import OnboardingGuide from './OnboardingGuide';
import { useGiftStore } from '@/store/useGiftStore';
import { useEffect } from 'react';

export default function Layout() {
  const initialize = useGiftStore(state => state.initialize);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <div className="min-h-screen bg-cream-100 dark:bg-ink-900 transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <OnboardingGuide />
    </div>
  );
}
