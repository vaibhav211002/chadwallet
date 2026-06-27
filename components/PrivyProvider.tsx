'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';


const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl';

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <BasePrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: { theme: 'dark', accentColor: '#00ff88' },
        loginMethods: ['apple', 'google', 'wallet', 'email'],
        embeddedWallets: {
          solana: { createOnLogin: 'users-without-wallets' },
        },
      } as any}
    >
      {children}
    </BasePrivyProvider>
  );
}
