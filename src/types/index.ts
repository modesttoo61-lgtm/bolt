export interface Profile {
  id: string;
  demo_balance: number;
  created_at: string;
}

export interface Holding {
  id: string;
  user_id: string;
  coin_id: string;
  symbol: string;
  amount: number;
  avg_buy_price: number;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  coin_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit';
  price: number;
  quantity: number;
  total: number;
  market_type: 'spot' | 'futures';
  leverage: number;
  created_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  coin_id: string;
  symbol: string;
  side: 'long' | 'short';
  leverage: number;
  entry_price: number;
  quantity: number;
  margin: number;
  status: 'open' | 'closed';
  exit_price: number | null;
  pnl: number | null;
  created_at: string;
  closed_at: string | null;
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d?: { price: number[] };
}

export type Page = 'dashboard' | 'spot' | 'futures' | 'history' | 'learn';
