'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import TokenBanner from './TokenBanner';
import { usePrivy } from '@privy-io/react-auth';
import { Token } from '@/lib/birdeye';
import { formatPct, formatVolume, formatPrice } from '@/lib/utils';



const APPLE_URL = 'https://apps.apple.com/us/app/chadwallet/id6757367474';
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=xyz.chadwallet.www';

interface Props { tokens: Token[]; }

/* ─── tiny sub-components ─── */

function Pill({ children, color = 'green' }: { children: React.ReactNode; color?: 'green' | 'purple' | 'yellow' }) {
  const cls = color === 'green'
    ? 'bg-[#00ff8811] border-[#00ff8833] text-[#00ff88]'
    : color === 'purple'
    ? 'bg-[#7b5ef811] border-[#7b5ef833] text-[#7b5ef8]'
    : 'bg-[#ffd16611] border-[#ffd16633] text-[#ffd166]';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide uppercase ${cls}`}>
      {children}
    </span>
  );
}

function LiveDot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse inline-block" />;
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
      <path d="M17.523 15.341a.81.81 0 0 1-.81.81H7.287a.81.81 0 0 1-.81-.81V8.66a.81.81 0 0 1 .81-.81h9.426a.81.81 0 0 1 .81.81v6.68zM5.702 7.786a.65.65 0 0 0-.65.65v7.128a.65.65 0 0 0 .65.65.65.65 0 0 0 .65-.65V8.436a.65.65 0 0 0-.65-.65zm12.596 0a.65.65 0 0 0-.65.65v7.128a.65.65 0 0 0 .65.65.65.65 0 0 0 .65-.65V8.436a.65.65 0 0 0-.65-.65zM8.394 5.006a.373.373 0 0 0-.513.128l-.32.551a.373.373 0 0 0 .64.385l.32-.551a.373.373 0 0 0-.127-.513zm7.212 0a.373.373 0 0 0-.127.513l.32.551a.373.373 0 0 0 .64-.385l-.32-.551a.373.373 0 0 0-.513-.128zM12 4.5C9.519 4.5 7.5 6.52 7.5 9h9C16.5 6.52 14.481 4.5 12 4.5z" />
    </svg>
  );
}

/* Animated counter */
function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = to / 60;
        const t = setInterval(() => {
          start = Math.min(start + step, to);
          setVal(Math.floor(start));
          if (start >= to) clearInterval(t);
        }, 16);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* Fake live trade feed */
const TRADE_TICKERS = ['BONK','WIF','SOL','MEW','FWOG','JUP','PYTH','BOME','PONKE','MYRO'];
function useLiveFeed() {
  const [feed, setFeed] = useState<{ id: number; side: 'buy'|'sell'; symbol: string; amount: string; time: string }[]>([]);
  useEffect(() => {
    let id = 0;
    const add = () => {
      const side: 'buy' | 'sell' = Math.random() > 0.45 ? 'buy' : 'sell';
      const symbol = TRADE_TICKERS[Math.floor(Math.random() * TRADE_TICKERS.length)];
      const amt = (Math.random() * 9800 + 100).toFixed(0);
      setFeed(prev => [{ id: id++, side, symbol, amount: amt, time: 'just now' }, ...prev].slice(0, 6));
    };
    add();
    const iv = setInterval(add, 1800);
    return () => clearInterval(iv);
  }, []);
  return feed;
}

/* Mini sparkline from price changes */
function Sparkline({ positive }: { positive: boolean }) {
  const points = positive
    ? [40,36,38,32,28,30,24,20,18,14,10,8]
    : [10,12,14,18,16,20,22,26,28,32,34,38];
  const max = Math.max(...points), min = Math.min(...points);
  const norm = (v: number) => 38 - ((v - min) / (max - min)) * 36 + 1;
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${norm(v)}`).join(' ');
  return (
    <svg viewBox="0 0 110 40" className="w-16 h-8" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={positive ? '#00ff88' : '#ff4466'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── token card for trending grid ─── */
function TokenCard({ token, onClick }: { token: Token; onClick: () => void }) {
  const pos = token.priceChange24h >= 0;
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-2xl border border-[#1e1e2e] bg-[#0d0d14] hover:border-[#00ff8844] hover:bg-[#0d1510] transition-all duration-200 text-left group relative overflow-hidden"
    >
      {/* hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 0%, #00ff8808 0%, transparent 70%)' }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {token.logoURI ? (
            <img src={token.logoURI} alt={token.symbol} className="w-9 h-9 rounded-full ring-1 ring-[#2a2a40]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00ff88] to-[#7b5ef8] flex items-center justify-center text-xs font-black text-[#050508]">
              {token.symbol[0]}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-[#f0f0ff] group-hover:text-[#00ff88] transition-colors">{token.symbol}</div>
            <div className="text-xs text-[#404060] truncate max-w-[80px]">{token.name}</div>
          </div>
        </div>
        <Sparkline positive={pos} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-[#404060] mb-0.5">Price</div>
          <div className="text-sm font-semibold text-[#f0f0ff]">{formatPrice(token.price)}</div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${pos ? 'bg-[#00ff8815] text-[#00ff88]' : 'bg-[#ff446615] text-[#ff4466]'}`}>
          {formatPct(token.priceChange24h)}
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-[#1a1a28] flex justify-between text-xs text-[#404060]">
        <span>Vol 24h</span>
        <span className="text-[#8080a0]">{formatVolume(token.volume24h)}</span>
      </div>
    </button>
  );
}

/* ─── phone mockup ─── */
function PhoneMockup({ feed }: { feed: ReturnType<typeof useLiveFeed> }) {
  return (
    <div className="relative mx-auto w-64">
      {/* glow behind phone */}
      <div className="absolute inset-0 blur-3xl opacity-30 rounded-full"
        style={{ background: 'radial-gradient(circle, #00ff88 0%, #7b5ef8 60%, transparent 100%)' }} />

      <div className="relative rounded-[2.5rem] border-2 border-[#2a2a40] bg-[#0a0a10] overflow-hidden shadow-2xl float-anim">
        {/* status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <span className="text-[10px] text-[#8080a0] font-medium">9:41</span>
          <div className="w-16 h-4 rounded-full bg-[#0d0d14] border border-[#1e1e2e]" />
          <div className="flex gap-1 items-center">
            <div className="w-3 h-2 border border-[#8080a0] rounded-sm"><div className="w-full h-full bg-[#8080a0] rounded-sm scale-x-75 origin-left" /></div>
          </div>
        </div>

        {/* app header */}
        <div className="px-4 pb-3 flex items-center justify-between border-b border-[#1a1a24]">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#00ff88] to-[#7b5ef8] flex items-center justify-center font-black text-[8px] text-[#050508]">C</div>
            <span className="text-xs font-black text-[#f0f0ff]">ChadWallet</span>
          </div>
          <LiveDot />
        </div>

        {/* portfolio value */}
        <div className="px-4 pt-4 pb-2 text-center">
          <div className="text-[10px] text-[#8080a0] mb-0.5">Portfolio Value</div>
          <div className="text-2xl font-black text-[#f0f0ff]">$24,819</div>
          <div className="text-xs text-[#00ff88] font-semibold">+$1,204.32 (5.1%) today</div>
        </div>

        {/* mini chart placeholder */}
        <div className="mx-4 mb-3 h-16 rounded-xl bg-[#0d0d14] border border-[#1a1a24] overflow-hidden relative">
          <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 55 L20 48 L40 42 L60 45 L80 35 L100 28 L120 32 L140 20 L160 15 L180 10 L200 5 L200 60 L0 60 Z"
              fill="url(#chartGrad)" />
            <path d="M0 55 L20 48 L40 42 L60 45 L80 35 L100 28 L120 32 L140 20 L160 15 L180 10 L200 5"
              fill="none" stroke="#00ff88" strokeWidth="1.5" />
          </svg>
        </div>

        {/* live feed */}
        <div className="px-3 pb-4 space-y-1.5">
          <div className="text-[9px] text-[#404060] font-semibold uppercase tracking-widest px-1 mb-2">Live Trades</div>
          {feed.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#0d0d14]">
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${t.side === 'buy' ? 'bg-[#00ff8820] text-[#00ff88]' : 'bg-[#ff446620] text-[#ff4466]'}`}>
                  {t.side.toUpperCase()}
                </span>
                <span className="text-[10px] font-bold text-[#f0f0ff]">{t.symbol}</span>
              </div>
              <span className="text-[10px] text-[#8080a0]">${parseInt(t.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── main export ─── */
export default function LandingClient({ tokens }: Props) {
  const router = useRouter();
  const { login, authenticated } = usePrivy();
  const feed = useLiveFeed();
  const topTokens = tokens.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* TOP BANNER */}
      <TokenBanner tokens={tokens} direction="left" />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden grid-bg">
        {/* ambient blobs */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7b5ef815 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00ff8810 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* left: copy */}
          <div>
            <Pill color="green">
              <LiveDot /> Live on Solana
            </Pill>

            <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              <span className="text-[#f0f0ff]">trade like</span><br />
              <span className="gradient-text" style={{ WebkitTextStroke: '0px' }}>a chad.</span>
            </h1>

            <p className="text-lg text-[#8080a0] max-w-md leading-relaxed mb-8">
              Snipe memecoins, track whales, and swap any Solana token in seconds.
              Sign in with Apple or Google — no seed phrase needed.
            </p>

            {/* social sign-in callout */}
            <div className="flex items-center gap-3 mb-8 p-3 rounded-xl border border-[#1e1e2e] bg-[#0d0d14] w-fit">
              <div className="flex -space-x-1">
                {['🍎','G','🔑'].map((icon, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-[#1e1e2e] border border-[#2a2a40] flex items-center justify-center text-xs font-bold text-[#f0f0ff]">
                    {icon}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#8080a0]">Sign in with <strong className="text-[#f0f0ff]">Apple</strong>, <strong className="text-[#f0f0ff]">Google</strong>, or wallet</span>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => authenticated ? router.push('/trade') : login()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#050508] bg-[#00ff88] hover:bg-[#00e87a] transition-all hover:shadow-[0_0_32px_#00ff8840] active:scale-95"
              >
                {authenticated ? 'Open App →' : 'Start Trading Free →'}
              </button>
              <a href={APPLE_URL} target="_blank" rel="noopener"
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[#f0f0ff] border border-[#2a2a40] hover:border-[#00ff88] hover:text-[#00ff88] transition-all">
                <AppleIcon /> App Store
              </a>
              <a href={ANDROID_URL} target="_blank" rel="noopener"
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[#f0f0ff] border border-[#2a2a40] hover:border-[#00ff88] hover:text-[#00ff88] transition-all">
                <AndroidIcon /> Google Play
              </a>
            </div>

            {/* trust badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8080a0]">
              <span className="flex items-center gap-1">✓ <span>Non-custodial</span></span>
              <span className="flex items-center gap-1">✓ <span>0% platform fee</span></span>
              <span className="flex items-center gap-1">✓ <span>Jupiter-powered</span></span>
              <span className="flex items-center gap-1">✓ <span>SOL native</span></span>
            </div>
          </div>

          {/* right: phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup feed={feed} />
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <div className="border-y border-[#1e1e2e] bg-[#08080f]">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Volume Traded', to: 2100000000, prefix: '$', suffix: '+', display: '$2.1B+' },
            { label: 'Active Traders', to: 180000, prefix: '', suffix: '+', display: '180K+' },
            { label: 'Swap Speed', to: null, display: '< 0.5s' },
            { label: 'Platform Fee', to: null, display: '0%' },
          ].map(({ label, display }) => (
            <div key={label}>
              <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{display}</div>
              <div className="text-sm text-[#8080a0]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TRENDING TOKENS ─── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Pill color="green"><LiveDot /> Real-time data</Pill>
              <h2 className="mt-3 text-3xl md:text-4xl font-black text-[#f0f0ff]">
                Trending on Solana
              </h2>
              <p className="mt-2 text-[#8080a0]">Tap any token to start trading instantly</p>
            </div>
            <button onClick={() => authenticated ? router.push('/trade') : login()}
              className="hidden md:flex items-center gap-1.5 text-sm text-[#00ff88] hover:underline">
              View all tokens →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topTokens.map(token => (
              <TokenCard
                key={token.address}
                token={token}
                onClick={() => authenticated ? router.push(`/trade?token=${token.address}`) : login()}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 px-4 bg-[#07070e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Pill color="purple">Why ChadWallet</Pill>
            <h2 className="mt-4 text-3xl md:text-5xl font-black text-[#f0f0ff]">
              Built for degens,<br />
              <span className="gradient-text">by degens.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '⚡',
                title: 'Sub-second swaps',
                desc: 'Jupiter-powered routing finds the best price across every Solana DEX. No slippage surprises, no waiting.',
                badge: 'Powered by Jupiter',
              },
              {
                icon: '📊',
                title: 'Live price charts',
                desc: 'Real-time OHLCV data, holder distribution, and live trade feed — all in one view. Know before you ape.',
                badge: 'BirdEye data',
              },
              {
                icon: '🔐',
                title: 'Non-custodial',
                desc: 'Your keys, your coins. Embedded wallets through Privy — sign in with Apple or Google, own your assets.',
                badge: 'Privy embedded',
              },
              {
                icon: '📱',
                title: 'Mobile-first',
                desc: 'Open a trade on your phone, close it on desktop. Seamless cross-device experience built from the ground up.',
                badge: 'iOS & Android',
              },
              {
                icon: '🐋',
                title: 'Whale watching',
                desc: 'Track top holder moves and live transaction feed. Know exactly what the big players are doing in real time.',
                badge: 'Live feeds',
              },
              {
                icon: '🎯',
                title: 'Zero platform fees',
                desc: "We don't take a cut. ChadWallet earns nothing on your trades — just the best swap rates from the DEX.",
                badge: '0% fee',
              },
            ].map(({ icon, title, desc, badge }) => (
              <div key={title}
                className="p-6 rounded-2xl border border-[#1e1e2e] bg-[#0d0d14] hover:border-[#2a2a40] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 0% 0%, #7b5ef808 0%, transparent 60%)' }} />
                <div className="text-2xl mb-4">{icon}</div>
                <h3 className="text-[#f0f0ff] font-bold mb-2 text-lg">{title}</h3>
                <p className="text-sm text-[#8080a0] leading-relaxed mb-4">{desc}</p>
                <span className="text-[10px] font-semibold text-[#7b5ef8] bg-[#7b5ef811] border border-[#7b5ef822] px-2 py-1 rounded-full uppercase tracking-wide">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Pill color="yellow">Get started in 30 seconds</Pill>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-[#f0f0ff]">How it works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#2a2a40] to-transparent" />

            {[
              { step: '01', title: 'Sign in', desc: 'Use Apple, Google, or your existing Solana wallet. Embedded wallet created automatically.' },
              { step: '02', title: 'Fund', desc: 'Deposit SOL or any Solana token. Buy crypto with card coming soon.' },
              { step: '03', title: 'Trade', desc: 'Search any token, tap Buy, confirm. Fastest swap on Solana — guaranteed.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center p-6">
                <div className="w-14 h-14 rounded-2xl border border-[#2a2a40] bg-[#0d0d14] flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-black gradient-text">{step}</span>
                </div>
                <h3 className="text-[#f0f0ff] font-bold mb-2">{title}</h3>
                <p className="text-sm text-[#8080a0] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => authenticated ? router.push('/trade') : login()}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-[#050508] bg-[#00ff88] hover:bg-[#00e87a] transition-all hover:shadow-[0_0_40px_#00ff8840] active:scale-95"
            >
              {authenticated ? 'Open App →' : 'Create your wallet →'}
            </button>
          </div>
        </div>
      </section>

      {/* ─── LEADERBOARD TEASER ─── */}
      <section className="py-20 px-4 bg-[#07070e]">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-[#2a2a40] overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #0d0d14 0%, #0a0a12 100%)' }}>
            {/* decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, #7b5ef815 0%, transparent 70%)' }} />

            <div className="relative p-8 md:p-12">
              <div className="text-center mb-10">
                <Pill color="yellow">🏆 Top Traders This Week</Pill>
                <h2 className="mt-4 text-3xl md:text-4xl font-black text-[#f0f0ff]">Where will you rank?</h2>
                <p className="mt-2 text-[#8080a0]">Join 180K+ traders competing on the leaderboard</p>
              </div>

              {/* podium */}
              <div className="flex items-end justify-center gap-3 mb-10">
                {[
                  { rank: '#2', addr: '0xsol...f4ce', pct: '+561%', h: 'h-20', col: '#00ff88' },
                  { rank: '#1', addr: '0xch4d...b33f', pct: '+842%', h: 'h-28', col: '#ffd166' },
                  { rank: '#3', addr: '0xwif...h4t', pct: '+389%', h: 'h-14', col: '#7b5ef8' },
                ].map(({ rank, addr, pct, h, col }) => (
                  <div key={rank} className="flex flex-col items-center gap-2" style={{ order: rank === '#1' ? 2 : rank === '#2' ? 1 : 3 }}>
                    <div className="text-xs font-mono text-[#8080a0]">{addr}</div>
                    <div className={`w-16 rounded-t-xl ${h} flex items-center justify-center text-sm font-black`}
                      style={{ background: `${col}15`, border: `1px solid ${col}44`, color: col }}>
                      {rank}
                    </div>
                    <div className="text-sm font-bold" style={{ color: col }}>{pct}</div>
                  </div>
                ))}
              </div>

              {/* download CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href={APPLE_URL} target="_blank" rel="noopener"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-[#050508] bg-[#f0f0ff] hover:bg-white transition-all">
                  <AppleIcon /> Download for iOS
                </a>
                <a href={ANDROID_URL} target="_blank" rel="noopener"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-[#050508] bg-[#00ff88] hover:bg-[#00e87a] transition-all">
                  <AndroidIcon /> Download for Android
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, #00ff8808 0%, transparent 70%)' }} />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-[#f0f0ff] mb-4">
            Ready to trade like<br />
            <span className="gradient-text">a chad?</span>
          </h2>
          <p className="text-lg text-[#8080a0] mb-10">No seed phrases. No KYC. Just vibes and gains.</p>
          <button
            onClick={() => authenticated ? router.push('/trade') : login()}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-lg font-black text-[#050508] bg-[#00ff88] hover:bg-[#00e87a] transition-all hover:shadow-[0_0_60px_#00ff8840] active:scale-95"
          >
            {authenticated ? 'Go to App →' : 'Get Started Free →'}
          </button>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[#404060]">
            <span>✓ No platform fees</span>
            <span>·</span>
            <span>✓ Non-custodial</span>
            <span>·</span>
            <span>✓ Solana native</span>
          </div>
        </div>
      </section>

      {/* BOTTOM BANNER */}
      <TokenBanner tokens={tokens} direction="right" />

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#1e1e2e] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#7b5ef8] flex items-center justify-center font-black text-[#050508] text-xs">C</div>
            <span className="font-black text-[#f0f0ff]">ChadWallet</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#8080a0]">
            <a href="#" className="hover:text-[#f0f0ff] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#f0f0ff] transition-colors">Terms</a>
            <a href="https://twitter.com/chadwallet" target="_blank" rel="noopener" className="hover:text-[#f0f0ff] transition-colors">𝕏 Twitter</a>
            <a href={APPLE_URL} target="_blank" rel="noopener" className="hover:text-[#f0f0ff] transition-colors">iOS App</a>
            <a href={ANDROID_URL} target="_blank" rel="noopener" className="hover:text-[#f0f0ff] transition-colors">Android App</a>
          </div>
          <p className="text-xs text-[#2a2a40]">© 2026 ChadWallet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
