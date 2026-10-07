import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchMarketData } from '@/lib/market';
import type { Profile, CoinMarket, Page } from '@/types';
import { AuthScreen } from '@/components/AuthScreen';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { SpotTrading } from '@/components/SpotTrading';
import { FuturesTrading } from '@/components/FuturesTrading';
import { TradeHistory } from '@/components/TradeHistory';
import { LearnSection } from '@/components/LearnSection';
import { TopBar } from '@/components/TopBar';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [markets, setMarkets] = useState<CoinMarket[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }
    if (data) {
      setProfile(data as Profile);
    } else {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: userId, demo_balance: 100000 })
        .select()
        .maybeSingle();
      if (newProfile) setProfile(newProfile as Profile);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => {
          await loadProfile(newSession.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    async function loadMarkets() {
      try {
        const data = await fetchMarketData();
        if (!cancelled) setMarkets(data);
      } catch (err) {
        console.error('Market data fetch failed:', err);
      }
    }

    loadMarkets();
    const interval = setInterval(loadMarkets, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleSelectCoin = (coinId: string, page?: Page) => {
    setSelectedCoinId(coinId);
    if (page) setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          <p className="text-sm text-slate-500">Loading CryptoSim EDU...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} onSignOut={handleSignOut} />
      <div className="flex flex-1 flex-col lg:ml-64">
        <TopBar
          profile={profile}
          markets={markets}
          selectedCoinId={selectedCoinId}
          onSelectCoin={handleSelectCoin}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentPage === 'dashboard' && (
            <Dashboard
              profile={profile}
              markets={markets}
              onSelectCoin={handleSelectCoin}
              onNavigate={handleNavigate}
            />
          )}
          {currentPage === 'spot' && (
            <SpotTrading
              profile={profile}
              markets={markets}
              selectedCoinId={selectedCoinId}
              onSelectCoin={handleSelectCoin}
              onProfileUpdate={setProfile}
            />
          )}
          {currentPage === 'futures' && (
            <FuturesTrading
              profile={profile}
              markets={markets}
              selectedCoinId={selectedCoinId}
              onSelectCoin={handleSelectCoin}
              onProfileUpdate={setProfile}
            />
          )}
          {currentPage === 'history' && (
            <TradeHistory
              markets={markets}
              selectedCoinId={selectedCoinId}
              onSelectCoin={handleSelectCoin}
            />
          )}
          {currentPage === 'learn' && <LearnSection />}
        </main>
      </div>
    </div>
  );
}
