import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, ArrowRight, Info } from 'lucide-react';
import type { Profile, CoinMarket, Page } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatPercent, formatCompact, formatCurrency } from '@/lib/format';
import { useEffect, useState } from 'react';
import type { Holding } from '@/types';

interface DashboardProps {
  profile: Profile | null;
  markets: CoinMarket[];
  onSelectCoin: (coinId: string, page?: Page) => void;
  onNavigate: (page: Page) => void;
}

export function Dashboard({ profile, markets, onSelectCoin, onNavigate }: DashboardProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<number[]>([]);

  useEffect(() => {
    async function loadHoldings() {
      if (!profile) return;
      const { data } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });
      if (data) setHoldings(data as Holding[]);
    }
    loadHoldings();
  }, [profile]);

  const holdingsValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const market = markets.find((m) => m.id === h.coin_id);
      return sum + (market ? market.current_price * h.amount : 0);
    }, 0);
  }, [holdings, markets]);

  const totalPortfolio = (profile?.demo_balance ?? 0) + holdingsValue;

  const sortedMarkets = useMemo(() => {
    return [...markets].sort((a, b) => a.market_cap_rank - b.market_cap_rank);
  }, [markets]);

  const topGainers = useMemo(() => {
    return [...markets].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5);
  }, [markets]);

  const topLosers = useMemo(() => {
    return [...markets].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 5);
  }, [markets]);

  useEffect(() => {
    const totalValue = totalPortfolio;
    const base = 100000;
    const variation = ((totalValue - base) / base) * 100;
    const points: number[] = [];
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const wave = Math.sin(t * Math.PI * 3) * 2 + Math.sin(t * Math.PI * 7) * 0.8;
      const trend = variation * t;
      const noise = (Math.random() - 0.5) * 0.5;
      points.push(variation + wave + trend * 0.3 + noise);
    }
    setPortfolioHistory(points);
  }, [totalPortfolio]);

  const portfolioChange = totalPortfolio - 100000;
  const portfolioChangePct = (portfolioChange / 100000) * 100;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Hero portfolio summary */}
      <div className="card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-text mb-2">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-white sm:text-4xl">
              ${totalPortfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  portfolioChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {portfolioChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-sm ${portfolioChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({formatPercent(portfolioChangePct)})
              </span>
              <span className="text-xs text-slate-500">all-time</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-slate-500" />
                <span className="label-text">Cash</span>
              </div>
              <p className="text-lg font-bold text-white">
                ${(profile?.demo_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                <span className="label-text">Assets</span>
              </div>
              <p className="text-lg font-bold text-white">
                ${holdingsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Sparkline chart */}
        {portfolioHistory.length > 0 && (
          <div className="mt-6 h-20">
            <Sparkline data={portfolioHistory} positive={portfolioChange >= 0} />
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => onNavigate('spot')}
          className="group card flex items-center justify-between p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Spot Trading</p>
              <p className="text-xs text-slate-500">Buy and sell crypto</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400" />
        </button>

        <button
          onClick={() => onNavigate('futures')}
          className="group card flex items-center justify-between p-4 transition-all hover:border-amber-500/30 hover:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
              <BarChart3 className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Futures Trading</p>
              <p className="text-xs text-slate-500">Trade with leverage</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-amber-400" />
        </button>

        <button
          onClick={() => onNavigate('learn')}
          className="group card flex items-center justify-between p-4 transition-all hover:border-blue-500/30 hover:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Learn the Basics</p>
              <p className="text-xs text-slate-500">Educational guides</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-blue-400" />
        </button>
      </div>

      {/* Market overview */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-white">Market Overview</h2>
          <span className="text-xs text-slate-500">{markets.length} coins tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Coin</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">24h Change</th>
                <th className="hidden px-4 py-3 text-right font-medium md:table-cell">24h Volume</th>
                <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">Market Cap</th>
                <th className="px-4 py-3 text-right font-medium">Trade</th>
              </tr>
            </thead>
            <tbody>
              {sortedMarkets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    Loading market data...
                  </td>
                </tr>
              ) : (
                sortedMarkets.map((coin) => (
                  <tr
                    key={coin.id}
                    className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 text-sm text-slate-500">{coin.market_cap_rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={coin.image} alt={coin.symbol} className="h-6 w-6 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-white">{coin.symbol.toUpperCase()}</p>
                          <p className="text-xs text-slate-500">{coin.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white">
                      {formatPrice(coin.current_price)}
                    </td>
                    <td className="hidden px-4 py-3 text-right sm:table-cell">
                      <span
                        className={`text-sm font-medium ${
                          coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatPercent(coin.price_change_percentage_24h)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm text-slate-400 md:table-cell">
                      ${formatCompact(coin.total_volume)}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm text-slate-400 lg:table-cell">
                      ${formatCompact(coin.market_cap)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectCoin(coin.id, 'spot')}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-emerald-500/10 hover:text-emerald-400"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <TrendingUp className="h-4 w-4" /> Top Gainers (24h)
          </h3>
          <div className="space-y-2">
            {topGainers.map((coin) => (
              <button
                key={coin.id}
                onClick={() => onSelectCoin(coin.id, 'spot')}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-2.5">
                  <img src={coin.image} alt={coin.symbol} className="h-6 w-6 rounded-full" />
                  <span className="text-sm font-medium text-white">{coin.symbol.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">{formatPrice(coin.current_price)}</span>
                  <span className="text-sm font-medium text-emerald-400">{formatPercent(coin.price_change_percentage_24h)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-400">
            <TrendingDown className="h-4 w-4" /> Top Losers (24h)
          </h3>
          <div className="space-y-2">
            {topLosers.map((coin) => (
              <button
                key={coin.id}
                onClick={() => onSelectCoin(coin.id, 'spot')}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-2.5">
                  <img src={coin.image} alt={coin.symbol} className="h-6 w-6 rounded-full" />
                  <span className="text-sm font-medium text-white">{coin.symbol.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">{formatPrice(coin.current_price)}</span>
                  <span className="text-sm font-medium text-rose-400">{formatPercent(coin.price_change_percentage_24h)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Your Holdings */}
      {holdings.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Your Holdings</h3>
          <div className="space-y-2">
            {holdings.filter((h) => h.amount > 0).map((h) => {
              const market = markets.find((m) => m.id === h.coin_id);
              const value = market ? market.current_price * h.amount : 0;
              const cost = h.avg_buy_price * h.amount;
              const pnl = value - cost;
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
              return (
                <button
                  key={h.id}
                  onClick={() => onSelectCoin(h.coin_id, 'spot')}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-3 transition-colors hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    {market?.image && <img src={market.image} alt={h.symbol} className="h-7 w-7 rounded-full" />}
                    <div>
                      <p className="text-sm font-medium text-white">{h.symbol}</p>
                      <p className="text-xs text-slate-500">{h.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })} {h.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatCurrency(value)}</p>
                    <p className={`text-xs ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({formatPercent(pnlPct)})
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const width = 800;
  const height = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const color = positive ? '#10b981' : '#f43f5e';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sparkline-grad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
