import { trailKeys } from '../../modules/trail-keys/src/trail-keys';
import { equalHashes, randomHex, readSecret, writeSecret } from './secure-values';
import { nextAttempt, parseAttempts, parseCredential } from './credentials';

const PASSCODE_KEY = 'passcode-v1';
const ATTEMPTS_KEY = 'passcode-attempts-v1';
let isChecking = false;

export const hasPasscode = async () => (await readSecret(PASSCODE_KEY)) !== null;

/** Creates the first passcode. There is intentionally no unauthenticated reset path. */
export async function createPasscode(passcode: string): Promise<void> {
  if (isChecking) throw new Error('A passcode operation is already running.');
  isChecking = true;
  try {
    if (await hasPasscode()) throw new Error('A passcode is already configured.');
    if (!/^[0-9]{6,12}$/.test(passcode)) throw new Error('Use 6 to 12 digits.');
    const salt = await randomHex();
    const hash = await trailKeys.derivePasscode(passcode, salt);
    await writeSecret(PASSCODE_KEY, JSON.stringify({ salt, hash }));
  } finally { isChecking = false; }
}

/** Authorizes one operation, with persistent progressive throttling. */
export async function authorize(passcode: string): Promise<void> {
  if (isChecking) throw new Error('A passcode operation is already running.');
  isChecking = true;
  try { await checkPasscode(passcode); }
  finally { isChecking = false; }
}

async function checkPasscode(passcode: string): Promise<void> {
  const saved = await readSecret(PASSCODE_KEY);
  if (!saved) throw new Error('Set a passcode first.');
  const attempts = parseAttempts(await readSecret(ATTEMPTS_KEY));
  if (attempts.until > Date.now()) throw new Error('Too many attempts. Please try again later.');
  const { salt, hash } = parseCredential(saved);
  const candidate = /^[0-9]{6,12}$/.test(passcode) ? await trailKeys.derivePasscode(passcode, salt) : '';
  if (!equalHashes(candidate, hash)) {
    await writeSecret(ATTEMPTS_KEY, JSON.stringify(nextAttempt(attempts, Date.now())));
    throw new Error('Incorrect passcode.');
  }
  await writeSecret(ATTEMPTS_KEY, '{"failures":0,"until":0}');
}
