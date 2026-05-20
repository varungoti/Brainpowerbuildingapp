// AES-GCM helpers for storing OAuth tokens at rest.
// Pure WebCrypto so it runs identically in Deno edge and browser.
const enc = new TextEncoder();
const dec = new TextDecoder();

async function keyFromSecret(secret: string) {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function b64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

export async function encryptText(plain: string) {
  const secret = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!secret) throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  const key = await keyFromSecret(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain)),
  );
  return `${b64(iv)}.${b64(cipher)}`;
}

export async function decryptText(value: string) {
  const secret = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!secret) throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  const [ivB64, cipherB64] = value.split(".");
  const key = await keyFromSecret(secret);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) },
    key,
    fromB64(cipherB64),
  );
  return dec.decode(plain);
}
