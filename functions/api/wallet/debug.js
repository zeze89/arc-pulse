// TEMPORARY diagnostic endpoint — does not expose secret material, only
// lengths and the non-secret PEM boilerplate. Delete after debugging.
export async function onRequestGet({ env }) {
  const pub = env.CIRCLE_ENTITY_PUBLIC_KEY || '';
  const secret = env.CIRCLE_ENTITY_SECRET || '';
  const apiKey = env.CIRCLE_API_KEY || '';
  return Response.json({
    apiKeyLen: apiKey.length,
    apiKeyColons: (apiKey.match(/:/g) || []).length,
    entitySecretLen: secret.length,
    entitySecretIsHex: /^[0-9a-fA-F]+$/.test(secret.trim()),
    pubKeyLen: pub.length,
    pubKeyFirst40: JSON.stringify(pub.slice(0, 40)),
    pubKeyLast40: JSON.stringify(pub.slice(-40)),
    pubKeyLineCount: pub.split('\n').length,
  });
}
