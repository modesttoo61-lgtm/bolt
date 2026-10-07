import { useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import type { Profile, CoinMarket, Page } from '@/types';
import { formatPrice } from '@/lib/format';

interface TopBarProps {
  profile: Profile | null;
  markets: CoinMarket[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string, page?: Page) => void;
}

export function TopBar({ profile, markets, selectedCoinId, onSelectCoin }: TopBarProps) {
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCoin = markets.find((m) => m.id === selectedCoinId);

  const filteredMarkets = markets.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setCoinDropdownOpen(!coinDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 transition-all hover:border-slate-700"
          >
            {selectedCoin?.image && (
              <img src={selectedCoin.image} alt={selectedCoin.symbol} className="h-5 w-5 rounded-full" />
            )}
            <span className="text-sm font-semibold text-white">{selectedCoin?.symbol?.toUpperCase() ?? 'BTC'}</span>
            {selectedCoin && (
              <span className="hidden text-sm text-slate-400 sm:inline">{formatPrice(selectedCoin.current_price)}</span>
            )}
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {coinDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCoinDropdownOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
                <div className="border-b border-slate-800 p-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search coins..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-8 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {filteredMarkets.map((coin) => (
                    <button
                      key={coin.id}
                      onClick={() => {
                        onSelectCoin(coin.id);
                        setCoinDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-all hover:bg-slate-800"
                    >
                      <img src={coin.image} alt={coin.symbol} className="h-6 w-6 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{coin.symbol.toUpperCase()}</p>
                        <p className="text-xs text-slate-500">{coin.name}</p>
                      </div>
                      <span className="text-sm text-slate-300">{formatPrice(coin.current_price)}</span>
                      {coin.id === selectedCoinId && <Check className="h-4 w-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Balance</span>
        <span className="text-sm font-bold text-emerald-400">
          {profile ? `$${profile.demo_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </span>
      </div>
    </header>
  );
}
