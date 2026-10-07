import type { CoinMarket } from '@/types';

const COIN_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'cardano', 'dogecoin', 'avalanche-2', 'polkadot', 'chainlink',
  'polygon', 'litecoin', 'uniswap', 'stellar', 'cosmos',
];

export const TRACKED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
];

export async function fetchMarketData(): Promise<CoinMarket[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch market data (${response.status})`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected market data format');
  }
  return data as CoinMarket[];
}

export async function fetchSinglePrice(coinId: string): Promise<number | null> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (!data || !data[coinId] || typeof data[coinId].usd !== 'number') return null;
  return data[coinId].usd;
}
