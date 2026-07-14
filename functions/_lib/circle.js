const CIRCLE_BASE = 'https://api.circle.com/v1/w3s';

function pemToBuf(pem) {
  const b64 = pem
    .replace(/\\n/g, '\n')          // in case newlines got stored as literal backslash-n
    .split('\n')
    .filter(line => !line.includes('-----'))  // drop BEGIN/END header+footer, whatever the label
    .join('')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function hexToBytes(hex) {
  const clean = hex.replace(/^0x/, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

function bufToB64(buf) {
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Circle requires a freshly-encrypted ciphertext of the entity secret on every
// single write call — ciphertexts are single-use, never reuse one across calls.
export async function entitySecretCiphertext(env) {
  if (!env.CIRCLE_API_KEY || !env.CIRCLE_ENTITY_SECRET || !env.CIRCLE_ENTITY_PUBLIC_KEY) {
    throw new Error('Circle credentials not configured on the server yet (CIRCLE_API_KEY / CIRCLE_ENTITY_SECRET / CIRCLE_ENTITY_PUBLIC_KEY).');
  }
  const key = await crypto.subtle.importKey(
    'spki',
    pemToBuf(env.CIRCLE_ENTITY_PUBLIC_KEY),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    hexToBytes(env.CIRCLE_ENTITY_SECRET)
  );
  return bufToB64(cipherBuf);
}

async function circleFetch(env, method, path, body) {
  const res = await fetch(CIRCLE_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.CIRCLE_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error?.message || `Circle API ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export function circleGet(env, path) {
  return circleFetch(env, 'GET', path);
}

export function circlePost(env, path, body) {
  return circleFetch(env, 'POST', path, body);
}

// Finds the USDC token balance entry for a wallet, whatever Circle's actual
// token identifier for Arc's native USDC-as-gas turns out to be — resolved
// empirically at runtime instead of hardcoded, since it's unverified.
export async function findUsdcBalance(env, walletId) {
  const res = await circleGet(env, `/wallets/${walletId}/balances`);
  const balances = res?.data?.tokenBalances || [];
  const usdc = balances.find(b => (b.token?.symbol || '').toUpperCase() === 'USDC')
    || balances.find(b => b.token?.isNative);
  return { usdc, all: balances };
}
