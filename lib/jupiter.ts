const JUPITER_API = 'https://quote-api.jup.ag/v6';

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<QuoteResponse | null> {
  try {
    const res = await fetch(
      `${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
    );
    if (!res.ok) throw new Error('Jupiter quote failed');
    return await res.json();
  } catch (e) {
    console.error('getQuote error:', e);
    return null;
  }
}

export async function getSwapTransaction(
  quoteResponse: QuoteResponse,
  userPublicKey: string,
  priorityFee: number = 1000
) {
  try {
    const res = await fetch(`${JUPITER_API}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: priorityFee,
        dynamicComputeUnitLimit: true,
      }),
    });
    if (!res.ok) throw new Error('Jupiter swap failed');
    return await res.json();
  } catch (e) {
    console.error('getSwapTransaction error:', e);
    return null;
  }
}

export function formatAmount(amount: string, decimals: number): number {
  return parseInt(amount) / Math.pow(10, decimals);
}

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
