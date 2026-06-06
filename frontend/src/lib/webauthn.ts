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

export async function createPasskey(challenge: { publicKey: Json }): Promise<Json> {
  const c = pkc();
  if (!c) throw new Error('Passkeys are not supported on this device.');
  const publicKey = c.parseCreationOptionsFromJSON(challenge.publicKey);
  const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Passkey registration was cancelled.');
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
