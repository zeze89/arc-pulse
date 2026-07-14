// TEMPORARY diagnostic endpoint — does not expose secret material, only
// lengths and the non-secret PEM boilerplate. Delete after debugging.
import { entitySecretCiphertext } from '../../_lib/circle.js';

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ env }) {
  const pub = env.CIRCLE_ENTITY_PUBLIC_KEY || '';
  const secret = env.CIRCLE_ENTITY_SECRET || '';
  const apiKey = env.CIRCLE_API_KEY || '';

  const secretHash = await sha256Hex(secret.trim());
  const pubKeyHash = await sha256Hex(pub.trim());

  let selfTest;
  try {
    const ct = await entitySecretCiphertext(env);
    selfTest = { ok: true, ciphertextLen: ct.length, ciphertextFirst20: ct.slice(0, 20), ciphertextLast20: ct.slice(-20) };
  } catch (e) {
    selfTest = { ok: false, error: e.message };
  }

  let pubKeyMatch;
  try {
    const res = await fetch('https://api.circle.com/v1/w3s/config/entity/publicKey', {
      headers: { Authorization: `Bearer ${env.CIRCLE_API_KEY}` },
    });
    const json = await res.json();
    const freshKey = json?.data?.publicKey || '';
    pubKeyMatch = {
      freshKeyLen: freshKey.length,
      storedKeyLen: pub.length,
      identical: freshKey.trim() === pub.trim(),
      freshFirst40: JSON.stringify(freshKey.slice(0, 40)),
      freshLast40: JSON.stringify(freshKey.slice(-40)),
    };
  } catch (e) {
    pubKeyMatch = { error: e.message };
  }

  let rawCall;
  try {
    const ct2 = await entitySecretCiphertext(env);
    const res = await fetch('https://api.circle.com/v1/w3s/developer/walletSets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.CIRCLE_API_KEY}` },
      body: JSON.stringify({ name: 'debug-probe', entitySecretCiphertext: ct2, idempotencyKey: crypto.randomUUID() }),
    });
    const json = await res.json().catch(() => ({}));
    rawCall = { status: res.status, body: json };
  } catch (e) {
    rawCall = { error: e.message };
  }

  return Response.json({
    apiKeyLen: apiKey.length,
    apiKeyColons: (apiKey.match(/:/g) || []).length,
    entitySecretLen: secret.length,
    entitySecretIsHex: /^[0-9a-fA-F]+$/.test(secret.trim()),
    pubKeyLen: pub.length,
    pubKeyFirst40: JSON.stringify(pub.slice(0, 40)),
    pubKeyLast40: JSON.stringify(pub.slice(-40)),
    pubKeyLineCount: pub.split('\n').length,
    secretHash,
    pubKeyHash,
    selfTest,
    pubKeyMatch,
    rawCall,
  });
}
