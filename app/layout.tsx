import type { Metadata } from 'next';
import './globals.css';
import PrivyProvider from '@/components/PrivyProvider';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ChadWallet — Trade Like a Chad',
  description: 'The fastest Solana trading app. Buy, sell, and track any token in seconds.',
  openGraph: {
    title: 'ChadWallet — Trade Like a Chad',
    description: 'The fastest Solana trading app.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PrivyProvider>
          <Navbar />
          <main className="pt-14">{children}</main>
        </PrivyProvider>
      </body>
    </html>
  );
}
