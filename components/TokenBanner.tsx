'use client';

import { useRouter } from 'next/navigation';
import { Token } from '@/lib/birdeye';
import { formatPrice, formatPct } from '@/lib/utils';

interface Props {
  tokens: Token[];
  direction?: 'left' | 'right';
}

function TokenChip({ token, onClick }: { token: Token; onClick: () => void }) {
  const isPositive = token.priceChange24h >= 0;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1e1e2e] bg-[#0d0d14] hover:border-[#00ff88] hover:bg-[#00ff8808] transition-all duration-200 group flex-shrink-0"
    >
      {token.logoURI ? (
        <img
          src={token.logoURI}
          alt={token.symbol}
          className="w-5 h-5 rounded-full flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00ff88] to-[#7b5ef8] flex-shrink-0" />
      )}
      <span className="text-xs font-bold text-[#f0f0ff] group-hover:text-[#00ff88] transition-colors">
        {token.symbol}
      </span>
      <span className="text-xs text-[#8080a0]">{formatPrice(token.price)}</span>
      <span className={`text-xs font-semibold ${isPositive ? 'text-[#00ff88]' : 'text-[#ff4466]'}`}>
        {formatPct(token.priceChange24h)}
      </span>
    </button>
  );
}

export default function TokenBanner({ tokens, direction = 'left' }: Props) {
  const router = useRouter();
  // Duplicate for seamless loop
  const doubled = [...tokens, ...tokens];
  const cls = direction === 'left' ? 'ticker-left' : 'ticker-right';

  return (
    <div className="w-full overflow-hidden py-2 border-y border-[#1e1e2e] bg-[#050508]">
      <div className={`flex gap-2 w-max ${cls}`}>
        {doubled.map((token, i) => (
          <TokenChip
            key={`${token.address}-${i}`}
            token={token}
            onClick={() => router.push(`/trade?token=${token.address}`)}
          />
        ))}
      </div>
    </div>
  );
}
