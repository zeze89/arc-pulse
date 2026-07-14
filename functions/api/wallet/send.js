import { entitySecretCiphertext, circlePost, findUsdcBalance } from '../../_lib/circle.js';

export async function onRequestPost({ request, env }) {
  let usdc;
  try {
    const { walletId, destinationAddress, amount } = await request.json();
    if (!walletId || !destinationAddress || !amount) {
      return Response.json({ error: 'walletId, destinationAddress and amount are required' }, { status: 400 });
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(destinationAddress)) {
      return Response.json({ error: 'destinationAddress is not a valid EVM address' }, { status: 400 });
    }

    ({ usdc } = await findUsdcBalance(env, walletId));
    if (!usdc) {
      return Response.json({ error: 'No USDC balance found on this wallet yet — fund it from faucet.circle.com first' }, { status: 400 });
    }

    const tx = await circlePost(env, '/developer/transactions/transfer', {
      walletId,
      // Native tokens (Arc's USDC-as-gas) must omit tokenId/tokenAddress entirely.
      ...(usdc.token.isNative ? {} : { tokenId: usdc.token.id }),
      destinationAddress,
      amounts: [String(amount)],
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
      entitySecretCiphertext: await entitySecretCiphertext(env),
      idempotencyKey: crypto.randomUUID(),
    });

    return Response.json({
      transactionId: tx.data.id,
      state: tx.data.state,
    });
  } catch (e) {
    return Response.json({ error: e.message, debugUsdcToken: usdc?.token }, { status: 500 });
  }
}
