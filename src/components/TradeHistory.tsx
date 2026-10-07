import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Filter, Loader2 } from 'lucide-react';
import type { CoinMarket, Trade, Position, Page } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatAmount, formatCurrency } from '@/lib/format';

interface TradeHistoryProps {
  markets: CoinMarket[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string, page?: Page) => void;
}

type Tab = 'trades' | 'positions';

export function TradeHistory({ markets, onSelectCoin }: TradeHistoryProps) {
  const [tab, setTab] = useState<Tab>('trades');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filter, setFilter] = useState<'all' | 'spot' | 'futures'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        setLoading(false);
        return;
      }
      const userId = session.session.user.id;

      const { data: tradeData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (tradeData) setTrades(tradeData as Trade[]);

      const { data: posData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (posData) setPositions(posData as Position[]);

      setLoading(false);
    }
    loadData();
  }, []);

  const filteredTrades = useMemo(() => {
    if (filter === 'all') return trades;
    return trades.filter((t) => t.market_type === filter);
  }, [trades, filter]);

  const closedPositions = useMemo(() => {
    return positions.filter((p) => p.status === 'closed');
  }, [positions]);

  const openPositions = useMemo(() => {
    return positions.filter((p) => p.status === 'open');
  }, [positions]);

  const totalRealizedPnL = useMemo(() => {
    return closedPositions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
  }, [closedPositions]);

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="label-text mb-1">Total Trades</p>
          <p className="text-lg font-bold text-white">{trades.length}</p>
        </div>
        <div className="card p-4">
          <p className="label-text mb-1">Spot Trades</p>
          <p className="text-lg font-bold text-white">{trades.filter((t) => t.market_type === 'spot').length}</p>
        </div>
        <div className="card p-4">
          <p className="label-text mb-1">Futures Trades</p>
          <p className="text-lg font-bold text-white">{trades.filter((t) => t.market_type === 'futures').length}</p>
        </div>
        <div className="card p-4">
          <p className="label-text mb-1">Realized PnL</p>
          <p className={`text-lg font-bold ${totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnL)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('trades')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            tab === 'trades' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Trade History
        </button>
        <button
          onClick={() => setTab('positions')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            tab === 'positions' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Positions
        </button>
      </div>

      {tab === 'trades' && (
        <div className="card overflow-hidden">
          {/* Filter */}
          <div className="flex items-center gap-2 border-b border-slate-800 p-4">
            <Filter className="h-4 w-4 text-slate-500" />
            {(['all', 'spot', 'futures'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
            </div>
          ) : filteredTrades.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">No trades yet. Start trading to build your history.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500">
                    <th className="px-4 py-2 text-left font-medium">Date</th>
                    <th className="px-4 py-2 text-left font-medium">Coin</th>
                    <th className="px-4 py-2 text-left font-medium">Side</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Price</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectCoin(t.coin_id, t.market_type === 'futures' ? 'futures' : 'spot')}
                          className="text-sm font-medium text-white hover:text-emerald-400"
                        >
                          {t.symbol.toUpperCase()}
                        </button>
                        {t.leverage > 1 && (
                          <span className="ml-1.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400">{t.leverage}x</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.side === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {t.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${t.market_type === 'futures' ? 'text-amber-400' : 'text-blue-400'}`}>
                          {t.market_type === 'futures' ? 'Futures' : 'Spot'}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right text-sm text-slate-300 sm:table-cell">{formatPrice(t.price)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-300">{formatAmount(t.quantity)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-white">{formatCurrency(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'positions' && (
        <div className="space-y-4">
          {/* Open positions */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-white">Open Positions ({openPositions.length})</h3>
            </div>
            {openPositions.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No open positions.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-500">
                      <th className="px-4 py-2 text-left font-medium">Symbol</th>
                      <th className="px-4 py-2 text-left font-medium">Side</th>
                      <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Entry</th>
                      <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Margin</th>
                      <th className="px-4 py-2 text-right font-medium">Size</th>
                      <th className="px-4 py-2 text-right font-medium">Opened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((p) => (
                      <tr key={p.id} className="border-b border-slate-800/50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-white">{p.symbol.toUpperCase()}</span>
                          <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">{p.leverage}x</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${p.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-right text-sm text-slate-300 sm:table-cell">{formatPrice(p.entry_price)}</td>
                        <td className="hidden px-4 py-3 text-right text-sm text-slate-300 sm:table-cell">{formatCurrency(p.margin)}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-300">{formatCurrency(p.quantity * p.entry_price)}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-500">
                          {new Date(p.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Closed positions */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-white">Closed Positions ({closedPositions.length})</h3>
            </div>
            {closedPositions.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No closed positions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-500">
                      <th className="px-4 py-2 text-left font-medium">Symbol</th>
                      <th className="px-4 py-2 text-left font-medium">Side</th>
                      <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Entry</th>
                      <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Exit</th>
                      <th className="px-4 py-2 text-right font-medium">Margin</th>
                      <th className="px-4 py-2 text-right font-medium">PnL</th>
                      <th className="px-4 py-2 text-right font-medium">Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedPositions.map((p) => (
                      <tr key={p.id} className="border-b border-slate-800/50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-white">{p.symbol.toUpperCase()}</span>
                          <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">{p.leverage}x</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${p.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-right text-sm text-slate-300 sm:table-cell">{formatPrice(p.entry_price)}</td>
                        <td className="hidden px-4 py-3 text-right text-sm text-slate-300 sm:table-cell">{p.exit_price ? formatPrice(p.exit_price) : '—'}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-300">{formatCurrency(p.margin)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${(p.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(p.pnl ?? 0) >= 0 ? '+' : ''}{formatCurrency(p.pnl ?? 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-500">
                          {p.closed_at ? new Date(p.closed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
