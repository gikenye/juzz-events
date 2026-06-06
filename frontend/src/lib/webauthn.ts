// WebAuthn ceremony glue. The backend returns webauthn-rs challenge objects shaped as
// { publicKey: PublicKeyCredential(Creation|Request)OptionsJSON }; the browser's native
// JSON parsers turn those into live options and serialize the result back for `finish`.

type Json = Record<string, unknown>;

// Some TS DOM libs don't yet type the JSON helpers; narrow via a local interface.
interface PkcStatic {
  parseCreationOptionsFromJSON(o: unknown): CredentialCreationOptions['publicKey'];
  parseRequestOptionsFromJSON(o: unknown): CredentialRequestOptions['publicKey'];
  isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean>;
}

function pkc(): PkcStatic | null {
  const g = globalThis as { PublicKeyCredential?: unknown };
  const c = g.PublicKeyCredential as Partial<PkcStatic> | undefined;
  return c && typeof c.parseCreationOptionsFromJSON === 'function' ? (c as PkcStatic) : null;
}

export function passkeySupported(): boolean {
  return pkc() !== null && typeof navigator !== 'undefined' && !!navigator.credentials;
}

const CRED_KEY = 'juzz.credId.v1'; // remember the passkey id for deposit signing

export async function createPasskey(challenge: { publicKey: Json }): Promise<Json> {
  const c = pkc();
  if (!c) throw new Error('Passkeys are not supported on this device.');
  const publicKey = c.parseCreationOptionsFromJSON(challenge.publicKey);
  const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Passkey registration was cancelled.');
  try { localStorage.setItem(CRED_KEY, cred.id); } catch { /* private mode */ }
  return (cred as unknown as { toJSON(): Json }).toJSON();
}

export async function getPasskey(challenge: { publicKey: Json }): Promise<Json> {
  const c = pkc();
  if (!c) throw new Error('Passkeys are not supported on this device.');
  const publicKey = c.parseRequestOptionsFromJSON(challenge.publicKey);
  const cred = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Passkey sign-in was cancelled.');
  return (cred as unknown as { toJSON(): Json }).toJSON();
}

// ── deposit signing (PWA Safe): a WebAuthn assertion over the SafeTxHash, encoded the
//    way the Safe WebAuthn signer decodes it: { authenticator_data, client_data_fields, r, s }.
export interface SafeAssertion {
  authenticator_data: string;
  client_data_fields: string;
  r: string;
  s: string;
}

// secp256r1 group order — for low-s normalization (the Safe verifier requires s ≤ n/2).
const N = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');

export async function signSafeTxHash(safeTxHashHex: string): Promise<SafeAssertion> {
  const challenge = hexToBytes(safeTxHashHex);
  const allow = credIdBytes();
  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge: challenge as BufferSource,
      timeout: 120000,
      userVerification: 'required',
      ...(allow ? { allowCredentials: [{ type: 'public-key', id: allow as BufferSource }] } : {}),
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Passkey signature was cancelled.');

  const resp = cred.response as AuthenticatorAssertionResponse;
  const authData = new Uint8Array(resp.authenticatorData);
  const clientJSON = new TextDecoder().decode(resp.clientDataJSON);
  const { r, s } = derToRS(new Uint8Array(resp.signature));

  return {
    authenticator_data: '0x' + bytesToHex(authData),
    client_data_fields: clientDataFields(clientJSON),
    r: '0x' + r.toString(16).padStart(64, '0'),
    s: '0x' + lowS(s).toString(16).padStart(64, '0'),
  };
}

// The clientDataJSON tail the on-chain verifier splices after the challenge value.
function clientDataFields(json: string): string {
  const key = '"challenge":"';
  const i = json.indexOf(key);
  if (i < 0) throw new Error('malformed clientDataJSON');
  const valStart = i + key.length;
  const valEnd = json.indexOf('"', valStart);
  const end = json.lastIndexOf('}');
  return json.slice(valEnd + 1, end);
}

// DER-encoded ECDSA signature → (r, s).
function derToRS(der: Uint8Array): { r: bigint; s: bigint } {
  let o = 0;
  if (der[o++] !== 0x30) throw new Error('bad DER');
  o++; // total length
  if (der[o++] !== 0x02) throw new Error('bad DER r');
  const rLen = der[o++];
  const r = bytesToBig(der.slice(o, o + rLen)); o += rLen;
  if (der[o++] !== 0x02) throw new Error('bad DER s');
  const sLen = der[o++];
  const s = bytesToBig(der.slice(o, o + sLen));
  return { r, s };
}

const lowS = (s: bigint) => (s > N / 2n ? N - s : s);

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function bytesToHex(b: Uint8Array): string {
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function bytesToBig(b: Uint8Array): bigint {
  return BigInt('0x' + (bytesToHex(b) || '0'));
}
function credIdBytes(): Uint8Array | undefined {
  try {
    const id = localStorage.getItem(CRED_KEY);
    if (!id) return undefined;
    const b64 = id.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  } catch { return undefined; }
}
