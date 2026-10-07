import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import type { Profile, CoinMarket, Holding, Trade, Page } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatAmount, formatPercent, formatCurrency } from '@/lib/format';

interface SpotTradingProps {
  profile: Profile | null;
  markets: CoinMarket[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string, page?: Page) => void;
  onProfileUpdate: (profile: Profile) => void;
}

export function SpotTrading({ profile, markets, selectedCoinId, onSelectCoin, onProfileUpdate }: SpotTradingProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCoin = markets.find((m) => m.id === selectedCoinId);
  const currentPrice = selectedCoin?.current_price ?? 0;

  const currentHolding = holdings.find((h) => h.coin_id === selectedCoinId);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;
      const { data: h } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });
      if (h) setHoldings(h as Holding[]);

      const { data: t } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', profile.id)
        .eq('market_type', 'spot')
        .order('created_at', { ascending: false })
        .limit(10);
      if (t) setRecentTrades(t as Trade[]);
    }
    loadData();
  }, [profile, success]);

  useEffect(() => {
    setAmount('');
    setError(null);
    setSuccess(null);
  }, [selectedCoinId]);

  const executionPrice = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const numericAmount = parseFloat(amount) || 0;
  const total = numericAmount * executionPrice;

  const setPercentOfBalance = (percent: number) => {
    if (side === 'buy') {
      const maxSpend = profile?.demo_balance ?? 0;
      const spend = (maxSpend * percent) / 100;
      setAmount((spend / executionPrice).toFixed(8));
    } else {
      const maxSell = currentHolding?.amount ?? 0;
      const sell = (maxSell * percent) / 100;
      setAmount(sell.toFixed(8));
    }
  };

  const handleTrade = async () => {
    if (!profile || !selectedCoin) return;
    setError(null);
    setSuccess(null);

    if (numericAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setError('Enter a valid limit price');
      return;
    }

    setLoading(true);

    try {
      const price = executionPrice;
      const tradeTotal = numericAmount * price;

      if (side === 'buy') {
        if (tradeTotal > profile.demo_balance) {
          setError('Insufficient balance for this trade');
          setLoading(false);
          return;
        }

        const newBalance = profile.demo_balance - tradeTotal;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ demo_balance: newBalance })
          .eq('id', profile.id);
        if (profileError) throw profileError;

        if (currentHolding) {
          const newAmount = currentHolding.amount + numericAmount;
          const newAvg = (currentHolding.avg_buy_price * currentHolding.amount + price * numericAmount) / newAmount;
          const { error: holdError } = await supabase
            .from('holdings')
            .update({ amount: newAmount, avg_buy_price: newAvg, updated_at: new Date().toISOString() })
            .eq('id', currentHolding.id);
          if (holdError) throw holdError;
        } else {
          const { error: holdError } = await supabase
            .from('holdings')
            .insert({
              user_id: profile.id,
              coin_id: selectedCoinId,
              symbol: selectedCoin.symbol,
              amount: numericAmount,
              avg_buy_price: price,
            });
          if (holdError) throw holdError;
        }

        const { error: tradeError } = await supabase.from('trades').insert({
          user_id: profile.id,
          coin_id: selectedCoinId,
          symbol: selectedCoin.symbol,
          side: 'buy',
          order_type: orderType,
          price,
          quantity: numericAmount,
          total: tradeTotal,
          market_type: 'spot',
          leverage: 1,
        });
        if (tradeError) throw tradeError;

        onProfileUpdate({ ...profile, demo_balance: newBalance });
        setSuccess(`Bought ${formatAmount(numericAmount)} ${selectedCoin.symbol.toUpperCase()} at ${formatPrice(price)}`);
      } else {
        if (!currentHolding || numericAmount > currentHolding.amount) {
          setError('Insufficient holdings to sell');
          setLoading(false);
          return;
        }

        const newBalance = profile.demo_balance + tradeTotal;
        const newAmount = currentHolding.amount - numericAmount;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ demo_balance: newBalance })
          .eq('id', profile.id);
        if (profileError) throw profileError;

        if (newAmount <= 0.00000001) {
          const { error: holdError } = await supabase.from('holdings').delete().eq('id', currentHolding.id);
          if (holdError) throw holdError;
        } else {
          const { error: holdError } = await supabase
            .from('holdings')
            .update({ amount: newAmount, updated_at: new Date().toISOString() })
            .eq('id', currentHolding.id);
          if (holdError) throw holdError;
        }

        const { error: tradeError } = await supabase.from('trades').insert({
          user_id: profile.id,
          coin_id: selectedCoinId,
          symbol: selectedCoin.symbol,
          side: 'sell',
          order_type: orderType,
          price,
          quantity: numericAmount,
          total: tradeTotal,
          market_type: 'spot',
          leverage: 1,
        });
        if (tradeError) throw tradeError;

        onProfileUpdate({ ...profile, demo_balance: newBalance });
        setSuccess(`Sold ${formatAmount(numericAmount)} ${selectedCoin.symbol.toUpperCase()} at ${formatPrice(price)}`);
      }

      setAmount('');
      setLimitPrice('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCoin) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 pb-20 lg:grid-cols-3 lg:pb-6">
      {/* Trading panel */}
      <div className="lg:col-span-1">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={selectedCoin.image} alt={selectedCoin.symbol} className="h-8 w-8 rounded-full" />
              <div>
                <p className="text-sm font-bold text-white">{selectedCoin.symbol.toUpperCase()}/USD</p>
                <p className="text-xs text-slate-500">{selectedCoin.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">{formatPrice(currentPrice)}</p>
              <p className={`text-xs ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPercent(selectedCoin.price_change_percentage_24h)}
              </p>
            </div>
          </div>

          {/* Buy/Sell tabs */}
          <div className="mb-4 flex rounded-xl bg-slate-800/50 p-1">
            <button
              onClick={() => { setSide('buy'); setAmount(''); setError(null); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                side === 'buy' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => { setSide('sell'); setAmount(''); setError(null); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                side === 'sell' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order type */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setOrderType('market')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                orderType === 'market'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                orderType === 'limit'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              Limit
            </button>
          </div>

          {orderType === 'limit' && (
            <div className="mb-3">
              <label className="label-text mb-1.5 block">Limit Price (USD)</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="input-field"
                placeholder={currentPrice.toString()}
              />
            </div>
          )}

          <div className="mb-3">
            <label className="label-text mb-1.5 block">
              Amount ({selectedCoin.symbol.toUpperCase()})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
              step="0.00000001"
            />
          </div>

          {/* Percentage buttons */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setPercentOfBalance(pct)}
                className="rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Price</span>
              <span className="text-slate-300">{formatPrice(executionPrice)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Amount</span>
              <span className="text-slate-300">{formatAmount(numericAmount)} {selectedCoin.symbol.toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 text-sm">
              <span className="font-medium text-slate-400">Total</span>
              <span className="font-bold text-white">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Available balance / holdings */}
          <div className="mb-4 flex justify-between text-xs text-slate-500">
            <span>Available: {side === 'buy' ? formatCurrency(profile?.demo_balance ?? 0) : `${formatAmount(currentHolding?.amount ?? 0)} ${selectedCoin.symbol.toUpperCase()}`}</span>
          </div>

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {success}
            </div>
          )}

          <button
            onClick={handleTrade}
            disabled={loading}
            className={side === 'buy' ? 'btn-primary w-full' : 'btn-danger w-full'}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${side === 'buy' ? 'Buy' : 'Sell'} ${selectedCoin.symbol.toUpperCase()}`}
          </button>
        </div>
      </div>

      {/* Price chart + info */}
      <div className="lg:col-span-2">
        <div className="card mb-4 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Price Chart — {selectedCoin.symbol.toUpperCase()}/USD</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">24h Range</span>
              <span className="text-slate-300">{formatPrice(selectedCoin.low_24h)} — {formatPrice(selectedCoin.high_24h)}</span>
            </div>
          </div>

          {selectedCoin.sparkline_in_7d?.price ? (
            <PriceChart
              data={selectedCoin.sparkline_in_7d.price}
              positive={selectedCoin.price_change_percentage_24h >= 0}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">Chart data loading...</div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="24h High" value={formatPrice(selectedCoin.high_24h)} />
            <Stat label="24h Low" value={formatPrice(selectedCoin.low_24h)} />
            <Stat label="Volume" value={`$${(selectedCoin.total_volume / 1_000_000).toFixed(2)}M`} />
            <Stat label="Market Cap" value={`$${(selectedCoin.market_cap / 1_000_000_000).toFixed(2)}B`} />
          </div>
        </div>

        {/* Recent trades */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-800 p-4">
            <h3 className="text-sm font-semibold text-white">Your Recent Spot Trades</h3>
          </div>
          {recentTrades.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">No trades yet. Start trading to see your history here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500">
                    <th className="px-4 py-2 text-left font-medium">Side</th>
                    <th className="px-4 py-2 text-right font-medium">Price</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                    <th className="px-4 py-2 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800/50">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.side === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {t.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-slate-300">{formatPrice(t.price)}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-slate-300">{formatAmount(t.quantity)}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-white">{formatCurrency(t.total)}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500">{new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <p className="label-text mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function PriceChart({ data, positive }: { data: number[]; positive: boolean }) {
  const width = 1000;
  const height = 260;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const color = positive ? '#10b981' : '#f43f5e';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="price-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#price-grad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
