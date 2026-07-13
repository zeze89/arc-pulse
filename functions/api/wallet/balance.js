import { circleGet, findUsdcBalance } from '../../_lib/circle.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const walletId = url.searchParams.get('walletId');
    const transactionId = url.searchParams.get('transactionId');

    const out = {};

    if (walletId) {
      const { usdc } = await findUsdcBalance(env, walletId);
      out.usdc = usdc ? { amount: usdc.amount, symbol: usdc.token.symbol } : { amount: '0', symbol: 'USDC' };
    }

    if (transactionId) {
      const tx = await circleGet(env, `/transactions/${transactionId}`);
      out.transaction = { state: tx.data.transaction.state, txHash: tx.data.transaction.txHash || null };
    }

    return Response.json(out);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
