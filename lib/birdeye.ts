const BIRDEYE_API_KEY = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || '';
const BASE_URL = 'https://public-api.birdeye.so';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap?: number;
  liquidity?: number;
  fdv?: number;
}

export interface Trade {
  blockUnixTime: number;
  side: 'buy' | 'sell';
  price: number;
  volumeUsd: number;
  from: { symbol: string; amount: number };
  to: { symbol: string; amount: number };
  source: string;
  txHash: string;
  owner: string;
}

export interface OHLCV {
  unixTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const headers = {
  'X-API-KEY': BIRDEYE_API_KEY,
  'x-chain': 'solana',
};

export async function getTrendingTokens(limit = 20): Promise<Token[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/defi/token_trending?sort_by=volume24hUSD&sort_type=desc&offset=0&limit=${limit}`,
      { headers, next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error('BirdEye trending failed');
    const data = await res.json();
    return (data?.data?.tokens || []).map((t: any) => ({
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals || 9,
      logoURI: t.logoURI,
      price: t.price || 0,
      priceChange24h: t.priceChange24hPercent || 0,
      volume24h: t.volume24hUSD || 0,
      marketCap: t.mc,
      liquidity: t.liquidity,
      fdv: t.fdv,
    }));
  } catch (e) {
    console.error('getTrendingTokens error:', e);
    return FALLBACK_TOKENS;
  }
}

export async function getTokenInfo(address: string): Promise<Token | null> {
  try {
    const res = await fetch(`${BASE_URL}/defi/token_overview?address=${address}`, {
      headers,
      next: { revalidate: 10 },
    });
    if (!res.ok) throw new Error('BirdEye token overview failed');
    const data = await res.json();
    const t = data?.data;
    if (!t) return null;
    return {
      address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals || 9,
      logoURI: t.logoURI,
      price: t.price || 0,
      priceChange24h: t.priceChange24hPercent || 0,
      volume24h: t.volume24hUSD || 0,
      marketCap: t.mc,
      liquidity: t.liquidity,
      fdv: t.fdv,
    };
  } catch (e) {
    console.error('getTokenInfo error:', e);
    return null;
  }
}

export async function getOHLCV(
  address: string,
  type: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' = '1H',
  limit = 100
): Promise<OHLCV[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const timeMap: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1H': 3600,
      '4H': 14400,
      '1D': 86400,
    };
    const from = now - timeMap[type] * limit;
    const res = await fetch(
      `${BASE_URL}/defi/ohlcv?address=${address}&type=${type}&time_from=${from}&time_to=${now}`,
      { headers, next: { revalidate: 10 } }
    );
    if (!res.ok) throw new Error('OHLCV fetch failed');
    const data = await res.json();
    return (data?.data?.items || []).map((item: any) => ({
      unixTime: item.unixTime,
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v,
    }));
  } catch (e) {
    console.error('getOHLCV error:', e);
    return [];
  }
}

export async function getTokenTrades(address: string, limit = 20): Promise<Trade[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/defi/txs/token?address=${address}&tx_type=swap&sort_type=desc&limit=${limit}`,
      { headers, next: { revalidate: 5 } }
    );
    if (!res.ok) throw new Error('Trades fetch failed');
    const data = await res.json();
    return (data?.data?.items || []).map((item: any) => ({
      blockUnixTime: item.blockUnixTime,
      side: item.side as 'buy' | 'sell',
      price: item.price || 0,
      volumeUsd: item.volumeUSD || 0,
      from: { symbol: item.from?.symbol || '', amount: item.from?.uiAmount || 0 },
      to: { symbol: item.to?.symbol || '', amount: item.to?.uiAmount || 0 },
      source: item.source || '',
      txHash: item.txHash || '',
      owner: item.owner || '',
    }));
  } catch (e) {
    console.error('getTokenTrades error:', e);
    return [];
  }
}

export async function getTokenHolders(address: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/v1/token/holder?address=${address}&offset=0&limit=20`,
      { headers, next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error('Holders fetch failed');
    const data = await res.json();
    return data?.data?.items || [];
  } catch (e) {
    console.error('getTokenHolders error:', e);
    return [];
  }
}

// Fallback tokens when API key not configured
export const FALLBACK_TOKENS: Token[] = [
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', decimals: 9, price: 145.23, priceChange24h: 3.2, volume24h: 1200000000, logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1.0, priceChange24h: 0.01, volume24h: 500000000, logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5, price: 0.00001823, priceChange24h: 12.4, volume24h: 89000000, logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I' },
  { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6, price: 0.82, priceChange24h: -2.1, volume24h: 45000000 },
  { address: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk', symbol: 'WEN', name: 'Wen', decimals: 5, price: 0.000078, priceChange24h: 8.9, volume24h: 23000000 },
  { address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'cat in a dogs world', decimals: 5, price: 0.0042, priceChange24h: -5.3, volume24h: 18000000 },
  { address: 'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump', symbol: 'FWOG', name: 'Fwog', decimals: 6, price: 0.019, priceChange24h: 22.1, volume24h: 12000000 },
  { address: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', symbol: 'BOME', name: 'Book of Meme', decimals: 6, price: 0.0067, priceChange24h: -3.8, volume24h: 9000000 },
];
