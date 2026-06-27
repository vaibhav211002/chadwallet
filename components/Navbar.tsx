'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Menu, X, Wallet } from 'lucide-react';

function shortenAddress(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { ready, authenticated, user, login, logout } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const displayName = walletAddress
    ? shortenAddress(walletAddress)
    : user?.email?.address?.split('@')[0] || 'Chad';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e2e] bg-[#050508]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#7b5ef8] flex items-center justify-center font-black text-[#050508] text-sm">C</div>
          <span className="font-black text-lg tracking-tight text-[#f0f0ff]">Chad<span className="text-[#00ff88]">Wallet</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="https://play.google.com/store/apps/details?id=xyz.chadwallet.www" target="_blank" rel="noopener" className="text-sm text-[#8080a0] hover:text-[#f0f0ff] transition-colors">Android</a>
          <a href="https://apps.apple.com/us/app/chadwallet/id6757367474" target="_blank" rel="noopener" className="text-sm text-[#8080a0] hover:text-[#f0f0ff] transition-colors">iOS</a>
        </div>

        <div className="flex items-center gap-3">
          {!ready ? (
            <div className="w-24 h-8 rounded-lg bg-[#1e1e2e] animate-pulse" />
          ) : authenticated ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d0d14] border border-[#2a2a40] hover:border-[#ff4466] transition-colors text-sm text-[#f0f0ff]"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00ff88] to-[#7b5ef8]" />
              {displayName}
            </button>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-[#050508] bg-[#00ff88] hover:bg-[#00e87a] transition-colors"
            >
              <Wallet size={14} /> Connect
            </button>
          )}
          <button className="md:hidden p-1.5 rounded-lg hover:bg-[#0d0d14]" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#1e1e2e] bg-[#050508] px-4 py-3 flex flex-col gap-3">
          <a href="https://play.google.com/store/apps/details?id=xyz.chadwallet.www" target="_blank" rel="noopener" className="text-sm text-[#8080a0] py-2">Android App</a>
          <a href="https://apps.apple.com/us/app/chadwallet/id6757367474" target="_blank" rel="noopener" className="text-sm text-[#8080a0] py-2">iOS App</a>
        </div>
      )}
    </nav>
  );
}
