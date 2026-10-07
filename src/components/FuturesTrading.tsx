import { useEffect, useState, useMemo } from 'react';
import { Loader2, AlertCircle, X, TrendingUp, TrendingDown, Layers, Info } from 'lucide-react';
import type { Profile, CoinMarket, Position, Page } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatAmount, formatPercent, formatCurrency } from '@/lib/format';

interface FuturesTradingProps {
  profile: Profile | null;
  markets: CoinMarket[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string, page?: Page) => void;
  onProfileUpdate: (profile: Profile) => void;
}

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 25, 50];

export function FuturesTrading({ profile, markets, selectedCoinId, onSelectCoin, onProfileUpdate }: FuturesTradingProps) {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(5);
  const [margin, setMargin] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [closePositionId, setClosePositionId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const selectedCoin = markets.find((m) => m.id === selectedCoinId);
  const currentPrice = selectedCoin?.current_price ?? 0;

  useEffect(() => {
    async function loadPositions() {
      if (!profile) return;
      const { data } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (data) setPositions(data as Position[]);
    }
    loadPositions();
  }, [profile, success]);

  useEffect(() => {
    setMargin('');
    setError(null);
    setSuccess(null);
  }, [selectedCoinId]);

  const numericMargin = parseFloat(margin) || 0;
  const positionSize = numericMargin * leverage;
  const quantity = currentPrice > 0 ? positionSize / currentPrice : 0;

  const liquidationPrice = useMemo(() => {
    if (currentPrice <= 0 || leverage <= 0) return 0;
    const buffer = 1 / leverage;
    if (side === 'long') {
      return currentPrice * (1 - buffer + 0.005);
    } else {
      return currentPrice * (1 + buffer - 0.005);
    }
  }, [currentPrice, leverage, side]);

  const setPercentOfBalance = (percent: number) => {
    const max = profile?.demo_balance ?? 0;
    const val = (max * percent) / 100;
    setMargin(val.toFixed(2));
  };

  const handleOpenPosition = async () => {
    if (!profile || !selectedCoin) return;
    setError(null);
    setSuccess(null);

    if (numericMargin <= 0) {
      setError('Enter a valid margin amount');
      return;
    }
    if (numericMargin > profile.demo_balance) {
      setError('Insufficient balance for this margin');
      return;
    }

    setLoading(true);

    try {
      const newBalance = profile.demo_balance - numericMargin;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ demo_balance: newBalance })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      const { error: posError } = await supabase.from('positions').insert({
        user_id: profile.id,
        coin_id: selectedCoinId,
        symbol: selectedCoin.symbol,
        side,
        leverage,
        entry_price: currentPrice,
        quantity,
        margin: numericMargin,
        status: 'open',
      });
      if (posError) throw posError;

      const { error: tradeError } = await supabase.from('trades').insert({
        user_id: profile.id,
        coin_id: selectedCoinId,
        symbol: selectedCoin.symbol,
        side: side === 'long' ? 'buy' : 'sell',
        order_type: 'market',
        price: currentPrice,
        quantity,
        total: positionSize,
        market_type: 'futures',
        leverage,
      });
      if (tradeError) throw tradeError;

      onProfileUpdate({ ...profile, demo_balance: newBalance });
      setSuccess(`Opened ${leverage}x ${side.toUpperCase()} position with ${formatCurrency(numericMargin)} margin on ${selectedCoin.symbol.toUpperCase()}`);
      setMargin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open position');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (pos: Position) => {
    if (!profile || !selectedCoin) return;
    setClosePositionId(pos.id);

    try {
      const exitPrice = currentPrice;
      let pnl: number;

      if (pos.side === 'long') {
        pnl = (exitPrice - pos.entry_price) * pos.quantity;
      } else {
        pnl = (pos.entry_price - exitPrice) * pos.quantity;
      }

      const returnedMargin = pos.margin + pnl;
      const newBalance = profile.demo_balance + returnedMargin;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ demo_balance: newBalance })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      const { error: posError } = await supabase
        .from('positions')
        .update({
          status: 'closed',
          exit_price: exitPrice,
          pnl,
          closed_at: new Date().toISOString(),
        })
        .eq('id', pos.id);
      if (posError) throw posError;

      const { error: tradeError } = await supabase.from('trades').insert({
        user_id: profile.id,
        coin_id: pos.coin_id,
        symbol: pos.symbol,
        side: pos.side === 'long' ? 'sell' : 'buy',
        order_type: 'market',
        price: exitPrice,
        quantity: pos.quantity,
        total: pos.quantity * exitPrice,
        market_type: 'futures',
        leverage: pos.leverage,
      });
      if (tradeError) throw tradeError;

      onProfileUpdate({ ...profile, demo_balance: newBalance });
      setSuccess(`Closed ${pos.symbol.toUpperCase()} ${pos.side.toUpperCase()} position with ${pnl >= 0 ? 'profit' : 'loss'} of ${formatCurrency(Math.abs(pnl))}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close position');
    } finally {
      setClosePositionId(null);
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
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Risk warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-300">Educational Futures Trading</p>
          <p className="mt-1 text-xs text-amber-300/70">
            This is a simulated environment using fictitious credits. Real futures trading involves significant risk of loss.
            Use this tool to understand leverage, margins, and position management before ever trading with real money.
          </p>
        </div>
        <button onClick={() => setShowInfo(true)} className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300 transition-all hover:bg-amber-500/10">
          How it works
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trading panel */}
        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={selectedCoin.image} alt={selectedCoin.symbol} className="h-8 w-8 rounded-full" />
                <div>
                  <p className="text-sm font-bold text-white">{selectedCoin.symbol.toUpperCase()}/USD</p>
                  <p className="text-xs text-slate-500">Perpetual</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{formatPrice(currentPrice)}</p>
                <p className={`text-xs ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent(selectedCoin.price_change_percentage_24h)}
                </p>
              </div>
            </div>

            {/* Long/Short tabs */}
            <div className="mb-4 flex rounded-xl bg-slate-800/50 p-1">
              <button
                onClick={() => { setSide('long'); setError(null); }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  side === 'long' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="h-4 w-4" /> Long
              </button>
              <button
                onClick={() => { setSide('short'); setError(null); }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  side === 'short' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingDown className="h-4 w-4" /> Short
              </button>
            </div>

            {/* Leverage selector */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="label-text">Leverage</label>
                <span className="text-sm font-bold text-amber-400">{leverage}x</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {LEVERAGE_OPTIONS.map((lev) => (
                  <button
                    key={lev}
                    onClick={() => setLeverage(lev)}
                    className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                      leverage === lev
                        ? 'bg-amber-500 text-white'
                        : 'border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            {/* Margin input */}
            <div className="mb-3">
              <label className="label-text mb-1.5 block">Margin (USD)</label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                className="input-field"
                placeholder="0.00"
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

            {/* Position summary */}
            <div className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Entry Price</span>
                <span className="text-slate-300">{formatPrice(currentPrice)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Position Size</span>
                <span className="text-slate-300">{formatCurrency(positionSize)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Quantity</span>
                <span className="text-slate-300">{formatAmount(quantity)} {selectedCoin.symbol.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Est. Liquidation</span>
                <span className="text-rose-400">{formatPrice(liquidationPrice)}</span>
              </div>
            </div>

            <div className="mb-4 text-xs text-slate-500">
              Available: {formatCurrency(profile?.demo_balance ?? 0)}
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
              onClick={handleOpenPosition}
              disabled={loading}
              className={side === 'long' ? 'btn-primary w-full' : 'btn-danger w-full'}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Open ${side === 'long' ? 'Long' : 'Short'} ${leverage}x`}
            </button>
          </div>
        </div>

        {/* Open positions */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-800 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers className="h-4 w-4 text-amber-400" /> Open Positions
              </h3>
            </div>

            {positions.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-slate-500">No open positions. Open a position to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-500">
                      <th className="px-4 py-2 text-left font-medium">Symbol</th>
                      <th className="px-4 py-2 text-left font-medium">Side</th>
                      <th className="px-4 py-2 text-right font-medium">Size</th>
                      <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Entry</th>
                      <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Mark</th>
                      <th className="px-4 py-2 text-right font-medium">PnL</th>
                      <th className="px-4 py-2 text-right font-medium">Margin</th>
                      <th className="px-4 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => {
                      let pnl: number;
                      let pnlPct: number;
                      if (pos.side === 'long') {
                        pnl = (currentPrice - pos.entry_price) * pos.quantity;
                      } else {
                        pnl = (pos.entry_price - currentPrice) * pos.quantity;
                      }
                      pnlPct = (pnl / pos.margin) * 100;

                      return (
                        <tr key={pos.id} className="border-b border-slate-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {selectedCoin && <span className="text-sm font-medium text-white">{pos.symbol.toUpperCase()}</span>}
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">{pos.leverage}x</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${pos.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pos.side === 'long' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {pos.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-300">{formatCurrency(pos.quantity * pos.entry_price)}</td>
                          <td className="hidden px-4 py-3 text-right text-sm text-slate-400 sm:table-cell">{formatPrice(pos.entry_price)}</td>
                          <td className="hidden px-4 py-3 text-right text-sm text-slate-400 sm:table-cell">{formatPrice(currentPrice)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              <p className="text-sm font-medium">{pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}</p>
                              <p className="text-xs">{formatPercent(pnlPct)}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-300">{formatCurrency(pos.margin)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleClosePosition(pos)}
                              disabled={closePositionId === pos.id}
                              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                            >
                              {closePositionId === pos.id ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : 'Close'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Position info cards */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <p className="label-text mb-1">What is Leverage?</p>
              <p className="text-xs text-slate-400">Borrowing to increase your position size. 10x leverage means a $1,000 margin controls $10,000 worth of crypto.</p>
            </div>
            <div className="card p-4">
              <p className="label-text mb-1">What is Margin?</p>
              <p className="text-xs text-slate-400">The collateral you put up to open a leveraged position. It's locked until you close the position.</p>
            </div>
            <div className="card p-4">
              <p className="label-text mb-1">What is Liquidation?</p>
              <p className="text-xs text-slate-400">When the price moves against you enough, your position is automatically closed and you lose your margin.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="card max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">How Futures Trading Works</h2>
              <button onClick={() => setShowInfo(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h3 className="mb-1 font-semibold text-emerald-400">Long Position</h3>
                <p>You profit when the price goes UP. You're betting that the crypto will increase in value.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-rose-400">Short Position</h3>
                <p>You profit when the price goes DOWN. You're betting that the crypto will decrease in value.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-amber-400">Leverage</h3>
                <p>Leverage multiplies your position size. With 10x leverage, a 1% price move means a 10% gain or loss on your margin. Higher leverage = higher risk.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-300">PnL (Profit & Loss)</h3>
                <p>For a long: PnL = (current price - entry price) x quantity. For a short: PnL = (entry price - current price) x quantity.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-300">Liquidation</h3>
                <p>If the price moves against your position by approximately (1/leverage), your position gets liquidated — you lose your entire margin. Always use stop-losses and manage risk.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
