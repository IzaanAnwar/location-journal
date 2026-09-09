export interface PasscodeCredential { salt: string; hash: string }
export interface PasscodeAttempts { failures: number; until: number }

export function parseCredential(encoded: string): PasscodeCredential {
  const credential: unknown = JSON.parse(encoded);
  if (!credential || typeof credential !== 'object' ||
    !('salt' in credential) || !('hash' in credential) ||
    typeof credential.salt !== 'string' || typeof credential.hash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(credential.salt) || !/^[a-f0-9]{64}$/.test(credential.hash)) {
    throw new Error('Passcode storage is damaged. Access is blocked.');
  }
  return { salt: credential.salt, hash: credential.hash };
}

export function parseAttempts(encoded: string | null): PasscodeAttempts {
  if (encoded === null) return { failures: 0, until: 0 };
  const attempts: unknown = JSON.parse(encoded);
  if (!attempts || typeof attempts !== 'object' || !('failures' in attempts) || !('until' in attempts) ||
    typeof attempts.failures !== 'number' || !Number.isInteger(attempts.failures) || attempts.failures < 0 || attempts.failures > 20 ||
    typeof attempts.until !== 'number' || !Number.isFinite(attempts.until) || attempts.until < 0) {
    throw new Error('Passcode attempt storage is damaged. Access is blocked.');
  }
  return { failures: attempts.failures, until: attempts.until };
}

export function nextAttempt(previous: PasscodeAttempts, now: number): PasscodeAttempts {
  const failures = Math.min(previous.failures + 1, 20);
  const delay = failures < 5 ? 0 : Math.min(3_600_000, 30_000 * 2 ** (failures - 5));
  return { failures, until: now + delay };
}
