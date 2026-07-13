import { entitySecretCiphertext, circlePost } from '../../_lib/circle.js';

export async function onRequestPost({ env }) {
  try {
    const walletSet = await circlePost(env, '/developer/walletSets', {
      name: `arc-pulse-${Date.now()}`,
      entitySecretCiphertext: await entitySecretCiphertext(env),
      idempotencyKey: crypto.randomUUID(),
    });
    const walletSetId = walletSet.data.walletSet.id;

    const wallets = await circlePost(env, '/developer/wallets', {
      accountType: 'EOA',
      blockchains: ['ARC-TESTNET'],
      count: 1,
      walletSetId,
      entitySecretCiphertext: await entitySecretCiphertext(env),
      idempotencyKey: crypto.randomUUID(),
    });
    const wallet = wallets.data.wallets[0];

    return Response.json({
      walletSetId,
      walletId: wallet.id,
      address: wallet.address,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
