import { getTrendingTokens } from '@/lib/birdeye';
import LandingClient from '@/components/LandingClient';

export const revalidate = 30;

export default async function HomePage() {
  const tokens = await getTrendingTokens(24);
  return <LandingClient tokens={tokens} />;
}
